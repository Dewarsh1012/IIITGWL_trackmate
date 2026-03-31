import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { Incident, Zone, Ward } from '../models';
import { AuthRequest, UserRole, AlertSeverity, AlertSource, AlertStatus } from '../types';
import { uploadEvidence, toPublicUploadPath } from '../middleware/upload';

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

        const incident = await Incident.create({
            ...body,
            reporter: body.source === AlertSource.SOS_PANIC || req.user!.role !== UserRole.AUTHORITY
                ? req.user!.userId
                : undefined,
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
