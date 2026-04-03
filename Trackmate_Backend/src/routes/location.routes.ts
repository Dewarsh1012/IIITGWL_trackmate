import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { LocationLog, Zone } from '../models';
import { AuthRequest, UserRole } from '../types';
import { findZoneForPoint, isPointInZone } from '../lib/geofence';

const router: Router = express.Router();

const locationSchema = z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy_meters: z.number().optional(),
    speed: z.number().optional(),
    heading: z.number().optional(),
    battery_level: z.number().int().min(0).max(100).optional(),
    source: z.enum(['gps', 'iot_band', 'manual']).optional(),
});

// ─── POST — log location ──────────────────────────────────────────────

router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const body = locationSchema.parse(req.body);

        // Get all active zones for geofencing
        const zones = await Zone.find({ is_active: true }).lean();
        const matchingZone = findZoneForPoint(body.latitude, body.longitude, zones as any);

        const log = await LocationLog.create({
            user: req.user!.userId,
            ...body,
            source: body.source || 'gps',
            is_in_safe_zone: matchingZone ? matchingZone.risk_level === 'safe' : false,
            current_zone: matchingZone ? matchingZone._id : undefined,
            recorded_at: new Date(),
        });

        // Emit position update to authority room
        const io = (req as any).app.get('io');
        if (io) {
            io.to('authority_room').emit('location:update', {
                userId: req.user!.userId,
                role: req.user!.role,
                latitude: body.latitude,
                longitude: body.longitude,
                zone: matchingZone ? { id: matchingZone._id, name: matchingZone.name, risk_level: matchingZone.risk_level } : null,
                timestamp: log.recorded_at,
            });
        }

        res.status(201).json({ success: true, data: { id: log._id, is_in_safe_zone: log.is_in_safe_zone, zone: matchingZone } });
    } catch (err) {
        next(err);
    }
});

// ─── GET — my recent locations ────────────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const limit = parseInt(String(req.query.limit || '50'));
        const logs = await LocationLog.find({ user: req.user!.userId })
            .sort({ recorded_at: -1 })
            .limit(limit)
            .lean();
        res.json({ success: true, data: logs });
    } catch (err) {
        next(err);
    }
});

// ─── GET — all recent locations (authority god-view) ──────────────────

router.get(
    '/all',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const cutoff = new Date(Date.now() - 30 * 60 * 1000); // last 30 min
            const logs = await LocationLog.find({ recorded_at: { $gte: cutoff } })
                .populate('user', 'full_name role blockchain_id avatar_url')
                .populate('current_zone', 'name risk_level')
                .sort({ recorded_at: -1 })
                .lean();
            res.json({ success: true, data: logs });
        } catch (err) {
            next(err);
        }
    }
);

// ─── GET — user location history (authority) ──────────────────────────

router.get(
    '/user/:userId',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const hours = parseInt(String(req.query.hours || '48'));
            const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
            const logs = await LocationLog.find({
                user: req.params.userId,
                recorded_at: { $gte: cutoff },
            })
                .sort({ recorded_at: -1 })
                .lean();
            res.json({ success: true, data: logs });
        } catch (err) {
            next(err);
        }
    }
);

// ─── GET — all recent daily check-ins (authority) ─────────────────────
router.get(
    '/checkins/all',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const { Incident } = await import('../models');
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h
            const checkins = await Incident.find({
                incident_type: 'checkin',
                created_at: { $gte: cutoff },
            })
                .populate('reporter', 'full_name role blockchain_id avatar_url')
                .populate('zone', 'name risk_level')
                .sort({ created_at: -1 })
                .limit(50)
                .lean();
            res.json({ success: true, data: checkins });
        } catch (err) {
            next(err);
        }
    }
);

// ─── GET — user check-in history (authority) ──────────────────────────
router.get(
    '/checkins/user/:userId',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const { Incident } = await import('../models');
            const checkins = await Incident.find({
                reporter: req.params.userId,
                incident_type: 'checkin',
            })
                .populate('zone', 'name risk_level')
                .sort({ created_at: -1 })
                .limit(30)
                .lean();
            res.json({ success: true, data: checkins });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
