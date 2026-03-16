import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { Business, Profile } from '../models';
import { AuthRequest, UserRole, BusinessCategory } from '../types';

const router: Router = express.Router();

const businessSchema = z.object({
    business_name: z.string().min(2).max(150),
    category: z.nativeEnum(BusinessCategory),
    description: z.string().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    address: z.string().optional(),
    zone: z.string().optional(),
    ward: z.string().optional(),
    operating_hours: z.record(z.string(), z.any()).optional(),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    logo_url: z.string().optional(),
});

// ─── GET all verified businesses (public) ────────────────────────────

router.get('/', async (req, res: Response, next) => {
    try {
        const { zone, ward, category } = req.query;
        const filter: Record<string, any> = { is_active: true, is_verified: true };
        if (zone) filter.zone = zone;
        if (ward) filter.ward = ward;
        if (category) filter.category = category;

        const businesses = await Business.find(filter)
            .populate('zone', 'name risk_level')
            .populate('ward', 'name district')
            .lean();
        res.json({ success: true, data: businesses });
    } catch (err) {
        next(err);
    }
});

// ─── GET my business ──────────────────────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const business = await Business.findOne({ owner: req.user!.userId })
            .populate('zone', 'name risk_level')
            .populate('ward', 'name district')
            .lean();
        res.json({ success: true, data: business });
    } catch (err) {
        next(err);
    }
});

// ─── POST create business ────────────────────────────────────────────

router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const body = businessSchema.parse(req.body);
        const existing = await Business.findOne({ owner: req.user!.userId });
        if (existing) {
            res.status(409).json({ success: false, message: 'You already have a registered business' });
            return;
        }
        const business = await Business.create({ ...body, owner: req.user!.userId });
        res.status(201).json({ success: true, data: business });
    } catch (err) {
        next(err);
    }
});

// ─── PATCH update business ───────────────────────────────────────────

router.patch('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const updates = businessSchema.partial().parse(req.body);
        const business = await Business.findOneAndUpdate(
            { owner: req.user!.userId },
            { $set: updates },
            { new: true, runValidators: true }
        );
        if (!business) {
            res.status(404).json({ success: false, message: 'Business not found' });
            return;
        }
        res.json({ success: true, data: business });
    } catch (err) {
        next(err);
    }
});

// ─── Authority: verify a business ───────────────────────────────────

router.patch(
    '/:id/verify',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const business = await Business.findByIdAndUpdate(
                _req.params.id,
                { $set: { is_verified: true } },
                { new: true }
            );
            if (!business) {
                res.status(404).json({ success: false, message: 'Business not found' });
                return;
            }
            res.json({ success: true, data: business });
        } catch (err) {
            next(err);
        }
    }
);

// ─── PUBLIC: verify tourist blockchain ID ────────────────────────────

router.get('/verify-tourist/:blockchainId', authenticate, async (req, res: Response, next) => {
    try {
        const profile = await Profile.findOne({
            blockchain_id: req.params.blockchainId,
            role: 'tourist',
        })
            .select('full_name role blockchain_id id_type id_last_four is_verified created_at')
            .lean();

        if (!profile) {
            res.json({ success: true, data: { valid: false, message: 'Blockchain ID not found' } });
            return;
        }

        // Check active trip
        const { Trip } = await import('../models');
        const now = new Date();
        const trip = await Trip.findOne({
            tourist: profile._id,
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now },
        }).lean();

        res.json({
            success: true,
            data: {
                valid: !!trip,
                name: profile.full_name,
                role: profile.role,
                blockchain_id: profile.blockchain_id,
                id_type: profile.id_type,
                id_last_four: profile.id_last_four,
                trip_valid_from: trip?.start_date,
                trip_valid_to: trip?.end_date,
                is_verified: profile.is_verified,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── Authority: list all businesses ──────────────────────────────────

router.get(
    '/all',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const businesses = await Business.find()
                .populate('owner', 'full_name email phone')
                .populate('zone', 'name risk_level')
                .populate('ward', 'name district')
                .sort({ created_at: -1 })
                .lean();
            res.json({ success: true, data: businesses });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
