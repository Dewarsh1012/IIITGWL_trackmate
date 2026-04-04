import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { Incident, Zone, Ward, LocationLog } from '../models';
import { AuthRequest, UserRole, AlertSeverity, AlertSource, AlertStatus } from '../types';
import { uploadEvidence, toPublicUploadPath } from '../middleware/upload';
import { calculateSpeed, distanceInMeters, findZoneForPoint } from '../lib/geofence';
import { combineRuleAndModelScore, scoreAnomalyRisk } from '../lib/anomalyModel';

const router: Router = express.Router();

const createIncidentSchema = z.object({
    incident_type: z.string().min(1),
    title: z.string().min(2).max(200),
    description: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    zone: z.string().optional(),
    ward: z.string().optional(),
    severity: z.nativeEnum(AlertSeverity),
    source: z.nativeEnum(AlertSource),
    is_public: z.boolean().optional(),
    metadata: z.record(z.string(), z.any()).optional(),
});

const updateIncidentSchema = z.object({
    status: z.nativeEnum(AlertStatus).optional(),
    assigned_to: z.string().optional(),
    severity: z.nativeEnum(AlertSeverity).optional(),
    is_public: z.boolean().optional(),
    description: z.string().optional(),
}).strict();

const SOS_RULE_SCORE = parseClampedNumber(process.env.SOS_RULE_SCORE, 0.96, 0, 1);
const SOS_MODEL_WEIGHT = parseClampedNumber(
    process.env.SOS_MODEL_WEIGHT || process.env.ANOMALY_MODEL_WEIGHT,
    0.35,
    0,
    1
);

// ─── GET incidents ────────────────────────────────────────────────────

router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const {
            status, severity, source, zone, ward, is_public,
            incident_type, page = '1', limit = '20', reporter
        } = req.query;

        const filter: Record<string, any> = {};

        // Role-based data scoping
        if (req.user!.role === UserRole.RESIDENT) {
            filter.is_public = true;
            // Ward filter applied client-side or via ward param
        } else if (req.user!.role === UserRole.TOURIST) {
            filter.reporter = req.user!.userId;
        }

        if (status) filter.status = status;
        if (severity) filter.severity = severity;
        if (source) filter.source = source;
        if (zone) filter.zone = zone;
        if (ward) filter.ward = ward;
        if (is_public !== undefined) filter.is_public = is_public === 'true';
        if (incident_type) filter.incident_type = incident_type;
        if (reporter) filter.reporter = reporter;

        const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));

        const [data, total] = await Promise.all([
            Incident.find(filter)
                .populate('reporter', 'full_name role blockchain_id')
                .populate('zone', 'name risk_level')
                .populate('ward', 'name district')
                .populate('assigned_to', 'full_name designation')
                .sort({ severity: -1, created_at: -1 })
                .skip(skip)
                .limit(parseInt(String(limit)))
                .lean(),
            Incident.countDocuments(filter),
        ]);

        res.json({ success: true, data, meta: { total, page: parseInt(String(page)), limit: parseInt(String(limit)) } });
    } catch (err) {
        next(err);
    }
});

// ─── GET single incident ──────────────────────────────────────────────

router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const incident = await Incident.findById(req.params.id)
            .populate('reporter', 'full_name role')
            .populate('zone', 'name risk_level')
            .populate('ward', 'name district')
            .populate('assigned_to', 'full_name designation')
            .lean();
        if (!incident) {
            res.status(404).json({ success: false, message: 'Incident not found' });
            return;
        }
        res.json({ success: true, data: incident });
    } catch (err) {
        next(err);
    }
});

// ─── POST create incident ─────────────────────────────────────────────

router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const body = createIncidentSchema.parse(req.body);
        const reporterId = body.source === AlertSource.SOS_PANIC || req.user!.role !== UserRole.AUTHORITY
            ? req.user!.userId
            : undefined;

        let metadata = body.metadata ? { ...body.metadata } : {};
        if (body.source === AlertSource.SOS_PANIC && reporterId) {
            const sosRiskMetadata = await buildSosRiskMetadata({
                reporterId,
                latitude: body.latitude,
                longitude: body.longitude,
            });
            metadata = {
                ...metadata,
                ...sosRiskMetadata,
                triggered_by_role: req.user!.role,
            };
        }

        const incident = await Incident.create({
            ...body,
            metadata,
            reporter: reporterId,
        });

        const populated = await incident.populate([
            { path: 'reporter', select: 'full_name role' },
            { path: 'zone', select: 'name risk_level' },
        ]);

        // Emit real-time event (Socket.IO instance attached to app)
        const io = (req as any).app.get('io');
        if (io) {
            io.to('authority_room').emit('incident:new', populated.toObject());
            io.to('authority_room').emit('new-incident', populated.toObject());
            io.to('role_tourist').to('role_resident').to('role_business').emit('new-incident', populated.toObject());
            if (body.source === AlertSource.SOS_PANIC) {
                io.to('authority_room').emit('sos:triggered', populated.toObject());
            }
        }

        res.status(201).json({ success: true, data: populated });
    } catch (err) {
        next(err);
    }
});

async function buildSosRiskMetadata(params: {
    reporterId: string;
    latitude?: number;
    longitude?: number;
}): Promise<Record<string, any>> {
    const { reporterId } = params;
    const now = Date.now();

    const [latestLogs, zones, recentIncidents, recentUserAnomalies] = await Promise.all([
        LocationLog.find({ user: reporterId })
            .sort({ recorded_at: -1 })
            .limit(2)
            .lean(),
        Zone.find({ is_active: true }).lean(),
        Incident.find({
            created_at: { $gte: new Date(now - 15 * 60 * 1000) },
            latitude: { $exists: true },
            longitude: { $exists: true },
        })
            .select('latitude longitude severity created_at')
            .lean(),
        Incident.countDocuments({
            reporter: reporterId,
            source: AlertSource.AI_ANOMALY,
            created_at: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
            status: { $in: ['active', 'acknowledged', 'assigned', 'escalated'] },
        }),
    ]);

    const latest = latestLogs[0];
    const previous = latestLogs[1];

    const latitude = toFiniteOrUndefined(params.latitude) ?? toFiniteOrUndefined(latest?.latitude);
    const longitude = toFiniteOrUndefined(params.longitude) ?? toFiniteOrUndefined(latest?.longitude);

    const inactivityMinutes = latest
        ? Math.max(0, (now - new Date(latest.recorded_at).getTime()) / 60000)
        : 60;

    let speedKmh = 0;
    if (latest && previous) {
        speedKmh = calculateSpeed(
            Number(latest.latitude),
            Number(latest.longitude),
            new Date(latest.recorded_at),
            Number(previous.latitude),
            Number(previous.longitude),
            new Date(previous.recorded_at)
        );
    }

    let isOutsideZone = false;
    let nearbyIncidents15m = 0;
    let nearbyCriticalIncidents15m = 0;

    if (latitude != null && longitude != null) {
        isOutsideZone = !findZoneForPoint(latitude, longitude, zones as any);
        const nearbyCounts = countNearbyIncidentStats(latitude, longitude, recentIncidents as any[]);
        nearbyIncidents15m = nearbyCounts.total;
        nearbyCriticalIncidents15m = nearbyCounts.critical;
    }

    const metrics = {
        inactivityMinutes,
        speedKmh,
        isOutsideZone,
        nearbyIncidents15m,
        nearbyCriticalIncidents15m,
        userAnomalies24h: recentUserAnomalies,
    };

    const model = await scoreAnomalyRisk(metrics);
    const hybridScore = combineRuleAndModelScore(SOS_RULE_SCORE, model.modelScore, SOS_MODEL_WEIGHT);
    const falseAlarmProbability = 1 - hybridScore;

    return {
        sos_risk_rule_score: roundTo(SOS_RULE_SCORE, 4),
        sos_risk_model_score: roundTo(model.modelScore, 4),
        sos_risk_hybrid_score: roundTo(hybridScore, 4),
        sos_risk_real_danger_probability: roundTo(hybridScore, 4),
        sos_risk_false_alarm_probability: roundTo(falseAlarmProbability, 4),
        sos_risk_confidence_band: getRiskBand(hybridScore),
        sos_risk_model_version: model.modelVersion,
        sos_risk_normalized_features: model.normalizedFeatures.map((value) => roundTo(value, 4)),
        sos_risk_metrics: {
            inactivityMinutes: roundTo(inactivityMinutes, 2),
            speedKmh: roundTo(speedKmh, 2),
            isOutsideZone,
            nearbyIncidents15m,
            nearbyCriticalIncidents15m,
            userAnomalies24h: recentUserAnomalies,
        },
    };
}

function countNearbyIncidentStats(
    latitude: number,
    longitude: number,
    incidents: Array<{ latitude?: number; longitude?: number; severity?: string }>
): { total: number; critical: number } {
    let total = 0;
    let critical = 0;

    for (const incident of incidents) {
        const lat = toFiniteOrUndefined(incident.latitude);
        const lng = toFiniteOrUndefined(incident.longitude);
        if (lat == null || lng == null) continue;

        const distance = distanceInMeters(latitude, longitude, lat, lng);
        if (distance > 600) continue;

        total += 1;
        if (incident.severity === 'critical' || incident.severity === 'high') {
            critical += 1;
        }
    }

    return { total, critical };
}

function parseClampedNumber(raw: string | undefined, fallback: number, min: number, max: number): number {
    const value = Number(raw);
    if (!Number.isFinite(value)) return fallback;
    return Math.max(min, Math.min(max, value));
}

function toFiniteOrUndefined(value: unknown): number | undefined {
    const num = Number(value);
    return Number.isFinite(num) ? num : undefined;
}

function roundTo(value: number, digits: number): number {
    const power = 10 ** digits;
    return Math.round(value * power) / power;
}

function getRiskBand(score: number): 'critical' | 'high' | 'medium' | 'low' {
    if (score >= 0.85) return 'critical';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
}

// ─── PATCH update incident (authority) ───────────────────────────────

router.patch(
    '/:id',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const updates = updateIncidentSchema.parse(req.body);

            const extra: Record<string, any> = {};
            if (updates.status === AlertStatus.RESOLVED) {
                extra.resolved_by = req.user!.userId;
                extra.resolved_at = new Date();
            }

            const incident = await Incident.findByIdAndUpdate(
                req.params.id,
                { $set: { ...updates, ...extra } },
                { new: true, runValidators: true }
            ).populate('reporter', 'full_name role');

            if (!incident) {
                res.status(404).json({ success: false, message: 'Incident not found' });
                return;
            }

            const io = (req as any).app.get('io');
            if (io) {
                io.to('authority_room').emit('incident:updated', incident.toObject());
                io.to('authority_room').emit('incident-updated', incident.toObject());
                io.to('role_tourist').to('role_resident').to('role_business').emit('incident-updated', incident.toObject());
            }

            res.json({ success: true, data: incident });
        } catch (err) {
            next(err);
        }
    }
);

// ─── POST upload evidence ─────────────────────────────────────────────

router.post('/:id/evidence', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const bodyUrls = req.body?.urls;
        const urls = Array.isArray(bodyUrls) ? bodyUrls : [];

        if (urls.length === 0) {
            res.status(400).json({ success: false, message: 'urls must be an array' });
            return;
        }
        const incident = await Incident.findByIdAndUpdate(
            req.params.id,
            { $push: { evidence_urls: { $each: urls } } },
            { new: true }
        );
        res.json({ success: true, data: incident });
    } catch (err) {
        next(err);
    }
});

router.post('/:id/evidence/upload', authenticate, async (req: AuthRequest, res: Response, next) => {
    uploadEvidence(req as any, res as any, async (uploadErr: any) => {
        if (uploadErr) {
            res.status(400).json({ success: false, message: uploadErr.message || 'Upload failed' });
            return;
        }

        try {
            const files = ((req as any).files || []) as Express.Multer.File[];
            if (!files.length) {
                res.status(400).json({ success: false, message: 'No evidence files uploaded' });
                return;
            }

            const urls = files.map((file) => toPublicUploadPath(file.path));

            const incident = await Incident.findByIdAndUpdate(
                req.params.id,
                { $push: { evidence_urls: { $each: urls } } },
                { new: true }
            );

            if (!incident) {
                res.status(404).json({ success: false, message: 'Incident not found' });
                return;
            }

            res.status(201).json({ success: true, data: incident, uploaded: urls });
        } catch (err) {
            next(err);
        }
    });
});

export default router;
