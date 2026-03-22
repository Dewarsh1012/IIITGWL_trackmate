import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { Alert, UserAlert, Profile } from '../models';
import { AuthRequest, UserRole, AlertPriority, AlertTargetGroup } from '../types';

const router: Router = express.Router();

const alertSchema = z.object({
    title: z.string().min(2).max(80),
    message: z.string().min(2).max(500),
    alert_type: z.enum(['emergency', 'safety_warning', 'weather', 'traffic', 'zone_update', 'curfew', 'evacuation', 'general']),
    priority: z.nativeEnum(AlertPriority),
    target_group: z.nativeEnum(AlertTargetGroup),
    target_user_id: z.string().optional(),
    target_zone_id: z.string().optional(),
    scheduled_for: z.string().optional(), // ISO date string
});

// ─── POST — create & send alert (authority only) ─────────────────────

router.post(
    '/',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const body = alertSchema.parse(req.body);

            const alert = await Alert.create({
                created_by: req.user!.userId,
                title: body.title,
                message: body.message,
                alert_type: body.alert_type,
                priority: body.priority,
                target_group: body.target_group,
                target_user_id: body.target_user_id || undefined,
                target_zone_id: body.target_zone_id || undefined,
                scheduled_for: body.scheduled_for ? new Date(body.scheduled_for) : undefined,
                sent_at: body.scheduled_for ? undefined : new Date(),
            });

            // Resolve target users based on target_group
            let targetUserIds: string[] = [];

            switch (body.target_group) {
                case AlertTargetGroup.ALL:
                    targetUserIds = (await Profile.find({ role: { $ne: 'authority' }, is_active: true }).select('_id').lean()).map((u: any) => u._id.toString());
                    break;
                case AlertTargetGroup.TOURISTS:
                    targetUserIds = (await Profile.find({ role: 'tourist', is_active: true }).select('_id').lean()).map((u: any) => u._id.toString());
                    break;
                case AlertTargetGroup.RESIDENTS:
                    targetUserIds = (await Profile.find({ role: 'resident', is_active: true }).select('_id').lean()).map((u: any) => u._id.toString());
                    break;
                case AlertTargetGroup.BUSINESSES:
                    targetUserIds = (await Profile.find({ role: 'business', is_active: true }).select('_id').lean()).map((u: any) => u._id.toString());
                    break;
                case AlertTargetGroup.USER:
                    if (body.target_user_id) targetUserIds = [body.target_user_id];
                    break;
                case AlertTargetGroup.ZONE:
                    // Users currently in the target zone — would need location data
                    // For now send to all non-authority users (can be refined later)
                    targetUserIds = (await Profile.find({ role: { $ne: 'authority' }, is_active: true }).select('_id').lean()).map((u: any) => u._id.toString());
                    break;
            }

            // Create UserAlert records
            const userAlerts = targetUserIds.map(userId => ({
                alert: alert._id,
                user: userId,
                delivered_at: new Date(),
            }));

            if (userAlerts.length > 0) {
                await UserAlert.insertMany(userAlerts, { ordered: false }).catch(() => {});
            }

            // Emit via socket if immediate (not scheduled)
            if (!body.scheduled_for) {
                const io = (req as any).app.get('io');
                if (io) {
                    const alertPayload = {
                        _id: alert._id,
                        title: alert.title,
                        message: alert.message,
                        alert_type: alert.alert_type,
                        priority: alert.priority,
                        created_at: alert.created_at,
                    };

                    // Emit to each user's personal room
                    for (const userId of targetUserIds) {
                        io.to(`user_${userId}`).emit('new_alert', alertPayload);
                    }

                    // Also broadcast to role rooms
                    if (body.target_group === AlertTargetGroup.ALL) {
                        io.to('role_tourist').to('role_resident').to('role_business').emit('new_alert', alertPayload);
                    } else if (body.target_group === AlertTargetGroup.TOURISTS) {
                        io.to('role_tourist').emit('new_alert', alertPayload);
                    } else if (body.target_group === AlertTargetGroup.RESIDENTS) {
                        io.to('role_resident').emit('new_alert', alertPayload);
                    } else if (body.target_group === AlertTargetGroup.BUSINESSES) {
                        io.to('role_business').emit('new_alert', alertPayload);
                    }
                }
            }

            res.status(201).json({
                success: true,
                data: alert,
                recipientCount: targetUserIds.length,
            });
        } catch (err) {
            next(err);
        }
    }
);

// ─── GET — all alerts (authority) ────────────────────────────────────

router.get(
    '/',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const { priority, alert_type, page = '1', limit = '20' } = req.query;
            const filter: any = {};
            if (priority) filter.priority = priority;
            if (alert_type) filter.alert_type = alert_type;

            const pageNum = parseInt(String(page));
            const limitNum = parseInt(String(limit));
            const skip = (pageNum - 1) * limitNum;

            const [alerts, total] = await Promise.all([
                Alert.find(filter)
                    .populate('created_by', 'full_name designation')
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                Alert.countDocuments(filter),
            ]);

            // Add read stats for each alert
            const alertsWithStats = await Promise.all(
                alerts.map(async (alert: any) => {
                    const totalRecipients = await UserAlert.countDocuments({ alert: alert._id });
                    const readCount = await UserAlert.countDocuments({ alert: alert._id, is_read: true });
                    const ackCount = await UserAlert.countDocuments({ alert: alert._id, is_acknowledged: true });
                    return { ...alert, recipientCount: totalRecipients, readCount, ackCount };
                })
            );

            res.json({
                success: true,
                data: alertsWithStats,
                total,
                page: pageNum,
                totalPages: Math.ceil(total / limitNum),
            });
        } catch (err) {
            next(err);
        }
    }
);

// ─── GET — my alerts (user) ──────────────────────────────────────────

router.get('/my', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { unreadOnly } = req.query;
        const filter: any = { user: req.user!.userId };
        if (unreadOnly === 'true') filter.is_read = false;

        const userAlerts = await UserAlert.find(filter)
            .populate({
                path: 'alert',
                populate: { path: 'created_by', select: 'full_name' },
            })
            .sort({ delivered_at: -1 })
            .limit(50)
            .lean();

        res.json({ success: true, data: userAlerts });
    } catch (err) {
        next(err);
    }
});

// ─── GET — unread count (user) ───────────────────────────────────────

router.get('/my/unread-count', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const count = await UserAlert.countDocuments({ user: req.user!.userId, is_read: false });
        res.json({ success: true, data: { count } });
    } catch (err) {
        next(err);
    }
});

// ─── PATCH — mark alert as read ──────────────────────────────────────

router.patch('/my/:alertId/read', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const userAlert = await UserAlert.findOneAndUpdate(
            { alert: req.params.alertId, user: req.user!.userId },
            { is_read: true, read_at: new Date() },
            { new: true }
        );
        if (!userAlert) {
            res.status(404).json({ success: false, message: 'Alert not found' });
            return;
        }
        res.json({ success: true, data: userAlert });
    } catch (err) {
        next(err);
    }
});

// ─── PATCH — acknowledge alert ───────────────────────────────────────

router.patch('/my/:alertId/acknowledge', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const userAlert = await UserAlert.findOneAndUpdate(
            { alert: req.params.alertId, user: req.user!.userId },
            { is_acknowledged: true, acknowledged_at: new Date(), is_read: true, read_at: new Date() },
            { new: true }
        );
        if (!userAlert) {
            res.status(404).json({ success: false, message: 'Alert not found' });
            return;
        }

        // +2 safety score if acknowledged within 2 minutes of receiving
        const deliveredAt = userAlert.delivered_at?.getTime() || 0;
        const ackTime = Date.now() - deliveredAt;
        if (ackTime < 2 * 60 * 1000) {
            await Profile.findByIdAndUpdate(req.user!.userId, { $inc: { safety_score: 2 } });
        }

        res.json({ success: true, data: userAlert });
    } catch (err) {
        next(err);
    }
});

export default router;
