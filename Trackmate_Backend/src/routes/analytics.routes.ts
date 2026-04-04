import express, { Router, Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { Incident, Profile, LocationLog, Zone } from '../models';
import { AuthRequest, UserRole } from '../types';
import {
    combineRuleAndModelScore,
    getAnomalyModelStatus,
    scoreAnomalyRisk,
    trainAndPersistAnomalyModel,
} from '../lib/anomalyModel';
import { buildRiskPulseSnapshot } from '../lib/riskPulse';

const router: Router = express.Router();

// ─── Incident trend (last 30 days, by type) ───────────────────────────

router.get(
    '/incidents',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const { from, to, zone, ward } = req.query;
            const start = from ? new Date(String(from)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const end = to ? new Date(String(to)) : new Date();

            const match: Record<string, any> = { created_at: { $gte: start, $lte: end } };
            if (zone) match.zone = zone;
            if (ward) match.ward = ward;

            const [byDay, byType, byZone, bySeverity, lifecycle] = await Promise.all([
                Incident.aggregate([
                    { $match: match },
                    {
                        $group: {
                            _id: {
                                date: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
                                type: '$incident_type',
                            },
                            count: { $sum: 1 },
                        },
                    },
                    { $sort: { '_id.date': 1 } },
                ]),
                Incident.aggregate([
                    { $match: match },
                    { $group: { _id: '$incident_type', count: { $sum: 1 } } },
                    { $sort: { count: -1 } },
                ]),
                Incident.aggregate([
                    { $match: match },
                    { $group: { _id: '$zone', count: { $sum: 1 } } },
                    { $lookup: { from: 'zones', localField: '_id', foreignField: '_id', as: 'zone' } },
                    { $unwind: { path: '$zone', preserveNullAndEmptyArrays: true } },
                    { $project: { name: { $ifNull: ['$zone.name', 'Unzoned'] }, count: 1 } },
                ]),
                Incident.aggregate([
                    { $match: match },
                    { $group: { _id: '$severity', count: { $sum: 1 } } },
                ]),
                Incident.aggregate([
                    { $match: match },
                    { $group: { _id: '$status', count: { $sum: 1 } } },
                ]),
            ]);

            res.json({
                success: true,
                data: { byDay, byType, byZone, bySeverity, lifecycle },
            });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Tourist activity (daily active count last 30 days) ───────────────

router.get(
    '/tourists',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const daily = await LocationLog.aggregate([
                { $match: { recorded_at: { $gte: cutoff } } },
                {
                    $lookup: {
                        from: 'profiles',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'profile',
                    },
                },
                { $unwind: '$profile' },
                { $match: { 'profile.role': 'tourist' } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$recorded_at' } },
                        count: { $addToSet: '$user' },
                    },
                },
                { $project: { date: '$_id', count: { $size: '$count' }, _id: 0 } },
                { $sort: { date: 1 } },
            ]);

            const totalTourists = await Profile.countDocuments({ role: 'tourist', is_active: true });
            const activeTourists = await LocationLog.distinct('user', {
                recorded_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            });

            res.json({
                success: true,
                data: { daily, totalTourists, activeTodayCount: activeTourists.length },
            });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Zone safety scores over time ────────────────────────────────────

router.get(
    '/zones',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const zones = await Zone.find({ is_active: true }).lean();
            const zoneStats = await Promise.all(
                zones.map(async (z) => {
                    const activeIncidents = await Incident.countDocuments({
                        zone: z._id,
                        status: { $in: ['active', 'acknowledged', 'assigned'] },
                    });
                    const resolvedLast7d = await Incident.countDocuments({
                        zone: z._id,
                        status: 'resolved',
                        resolved_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
                    });
                    return {
                        id: z._id,
                        name: z.name,
                        risk_level: z.risk_level,
                        active_incidents: activeIncidents,
                        resolved_last_7d: resolvedLast7d,
                    };
                })
            );

            res.json({ success: true, data: zoneStats });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Platform stats summary ───────────────────────────────────────────

router.get(
    '/summary',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const now = new Date();
            const todayStart = new Date(now.setHours(0, 0, 0, 0));
            const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

            const [totalUsers, openIncidents, sosLastHour, activeTodayUsers] = await Promise.all([
                Profile.countDocuments({ is_active: true }),
                Incident.countDocuments({ status: { $in: ['active', 'acknowledged', 'assigned'] } }),
                Incident.countDocuments({ source: 'sos_panic', created_at: { $gte: hourAgo } }),
                LocationLog.distinct('user', { recorded_at: { $gte: todayStart } }),
            ]);

            res.json({
                success: true,
                data: {
                    totalUsers,
                    openIncidents,
                    sosLastHour,
                    activeUsersToday: activeTodayUsers.length,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Anomaly model status (authority/admin) ─────────────────────────

router.get(
    '/anomaly-model',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const status = await getAnomalyModelStatus();
            res.json({ success: true, data: status });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Trigger anomaly model training (authority/admin) ───────────────

router.post(
    '/anomaly-model/train',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const maxSamplesInput = Number((req.body as Record<string, unknown>)?.maxSamples);
            const iterationsInput = Number((req.body as Record<string, unknown>)?.iterations);
            const learningRateInput = Number((req.body as Record<string, unknown>)?.learningRate);

            const result = await trainAndPersistAnomalyModel({
                maxSamples: Number.isFinite(maxSamplesInput) ? maxSamplesInput : undefined,
                iterations: Number.isFinite(iterationsInput) ? iterationsInput : undefined,
                learningRate: Number.isFinite(learningRateInput) ? learningRateInput : undefined,
            });

            res.json({ success: true, data: result });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Score anomaly features with active model ────────────────────────

router.post(
    '/anomaly-model/score',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const body = (req.body || {}) as Record<string, unknown>;
            const metrics = {
                inactivityMinutes: Number(body.inactivityMinutes),
                speedKmh: Number(body.speedKmh),
                isOutsideZone: Boolean(body.isOutsideZone),
                nearbyIncidents15m: Number(body.nearbyIncidents15m),
                nearbyCriticalIncidents15m: Number(body.nearbyCriticalIncidents15m),
                userAnomalies24h: Number(body.userAnomalies24h),
            };

            if (
                !Number.isFinite(metrics.inactivityMinutes) ||
                !Number.isFinite(metrics.speedKmh) ||
                !Number.isFinite(metrics.nearbyIncidents15m) ||
                !Number.isFinite(metrics.nearbyCriticalIncidents15m) ||
                !Number.isFinite(metrics.userAnomalies24h)
            ) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid input. Provide numeric feature values and isOutsideZone boolean.',
                });
                return;
            }

            const ruleScoreInput = Number(body.ruleScore);
            const ruleScore = Number.isFinite(ruleScoreInput) ? ruleScoreInput : 0.8;

            const scored = await scoreAnomalyRisk(metrics);
            const hybridScore = combineRuleAndModelScore(ruleScore, scored.modelScore);

            res.json({
                success: true,
                data: {
                    modelVersion: scored.modelVersion,
                    modelScore: scored.modelScore,
                    hybridScore,
                    normalizedFeatures: scored.normalizedFeatures,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Predictive risk pulse snapshot ─────────────────────────────────

router.get(
    '/risk-pulse',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const wardId = typeof req.query.ward === 'string' ? req.query.ward : undefined;
            const snapshot = await buildRiskPulseSnapshot(wardId);
            res.json({ success: true, data: snapshot });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Ward summary analytics ──────────────────────────────────────────

router.get(
    '/ward/:wardId',
    authenticate,
    async (req: AuthRequest, res: Response, next) => {
        try {
            const { wardId } = req.params;
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const [openIncidents, totalIncidents, touristCount, residentCount, activeUsersToday] = await Promise.all([
                Incident.countDocuments({ ward: wardId, status: { $in: ['active', 'acknowledged', 'assigned', 'escalated'] } }),
                Incident.countDocuments({ ward: wardId }),
                Profile.countDocuments({ ward: wardId, role: 'tourist', is_active: true }),
                Profile.countDocuments({ ward: wardId, role: 'resident', is_active: true }),
                LocationLog.distinct('user', { recorded_at: { $gte: todayStart } }),
            ]);

            const baseScore = 100;
            const penalty = Math.min(openIncidents * 8, 60);
            const safetyScore = Math.max(0, baseScore - penalty);

            res.json({
                success: true,
                data: {
                    wardId,
                    open_incidents: openIncidents,
                    total_incidents: totalIncidents,
                    tourist_count: touristCount,
                    resident_count: residentCount,
                    active_users_today: activeUsersToday.length,
                    safety_score: safetyScore,
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
