import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { Zone } from '../models';
import { AuthRequest, UserRole, ZoneRiskLevel } from '../types';

const router: Router = express.Router();

const zoneSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().optional(),
    risk_level: z.nativeEnum(ZoneRiskLevel),
    center_lat: z.number().min(-90).max(90),
    center_lng: z.number().min(-180).max(180),
    radius_meters: z.number().positive(),
    geojson: z.any().optional(),
    is_active: z.boolean().optional(),
    auto_alert: z.boolean().optional(),
});

// ─── GET all zones (public) ───────────────────────────────────────────

router.get('/', async (_req, res: Response, next) => {
    try {
        const zones = await Zone.find({ is_active: true })
            .populate('managed_by', 'full_name designation department')
            .lean();
        res.json({ success: true, data: zones });
    } catch (err) {
        next(err);
    }
});

// ─── GET single zone ──────────────────────────────────────────────────

router.get('/:id', async (req, res: Response, next) => {
    try {
        const zone = await Zone.findById(req.params.id).lean();
        if (!zone) {
            res.status(404).json({ success: false, message: 'Zone not found' });
            return;
        }
        res.json({ success: true, data: zone });
    } catch (err) {
        next(err);
    }
});

// ─── POST create zone (authority) ────────────────────────────────────

router.post(
    '/',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const body = zoneSchema.parse(req.body);
            const zone = await Zone.create({
                ...body,
                managed_by: req.user!.userId,
            });
            res.status(201).json({ success: true, data: zone });
        } catch (err) {
            next(err);
        }
    }
);

// ─── PATCH update zone (authority) ───────────────────────────────────

router.patch(
    '/:id',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const updates = zoneSchema.partial().parse(req.body);
            const zone = await Zone.findByIdAndUpdate(
                req.params.id,
                { $set: updates },
                { new: true, runValidators: true }
            );
            if (!zone) {
                res.status(404).json({ success: false, message: 'Zone not found' });
                return;
            }
            res.json({ success: true, data: zone });
        } catch (err) {
            next(err);
        }
    }
);

// ─── DELETE zone (authority) ──────────────────────────────────────────

router.delete(
    '/:id',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const zone = await Zone.findByIdAndDelete(_req.params.id);
            if (!zone) {
                res.status(404).json({ success: false, message: 'Zone not found' });
                return;
            }
            res.json({ success: true, message: 'Zone deleted' });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
