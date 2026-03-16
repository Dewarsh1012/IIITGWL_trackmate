import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { Profile } from '../models';
import { AuthRequest, UserRole } from '../types';

const router: Router = express.Router();

// ─── Get my profile ───────────────────────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const profile = await Profile.findById(req.user!.userId)
            .populate('ward', 'name district state center_lat center_lng')
            .lean();
        if (!profile) {
            res.status(404).json({ success: false, message: 'Profile not found' });
            return;
        }
        res.json({ success: true, data: profile });
    } catch (err) {
        next(err);
    }
});

// ─── Update my profile ────────────────────────────────────────────────

const updateProfileSchema = z.object({
    full_name: z.string().min(2).max(100).optional(),
    phone: z.string().optional(),
    preferred_language: z.string().optional(),
    avatar_url: z.string().url().optional(),
}).strict();

router.patch('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const updates = updateProfileSchema.parse(req.body);
        const profile = await Profile.findByIdAndUpdate(
            req.user!.userId,
            { $set: updates },
            { new: true, runValidators: true }
        ).populate('ward', 'name district state');

        res.json({ success: true, data: profile });
    } catch (err) {
        next(err);
    }
});

// ─── Authority: Get any profile by ID ────────────────────────────────

router.get(
    '/:id',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const profile = await Profile.findById(req.params.id)
                .populate('ward', 'name district state center_lat center_lng')
                .lean();
            if (!profile) {
                res.status(404).json({ success: false, message: 'Profile not found' });
                return;
            }
            res.json({ success: true, data: profile });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Authority: List all profiles by role ────────────────────────────

router.get(
    '/',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const { role, ward, is_verified, search, page = '1', limit = '20' } = req.query;
            const filter: Record<string, any> = {};
            if (role) filter.role = role;
            if (ward) filter.ward = ward;
            if (is_verified !== undefined) filter.is_verified = is_verified === 'true';
            if (search) {
                const rx = new RegExp(String(search), 'i');
                filter.$or = [{ full_name: rx }, { blockchain_id: rx }, { email: rx }];
            }

            const skip = (parseInt(String(page)) - 1) * parseInt(String(limit));
            const [data, total] = await Promise.all([
                Profile.find(filter)
                    .populate('ward', 'name district')
                    .sort({ created_at: -1 })
                    .skip(skip)
                    .limit(parseInt(String(limit)))
                    .lean(),
                Profile.countDocuments(filter),
            ]);

            res.json({ success: true, data, meta: { total, page: parseInt(String(page)), limit: parseInt(String(limit)) } });
        } catch (err) {
            next(err);
        }
    }
);

// ─── Authority: Verify a user ─────────────────────────────────────────

router.patch(
    '/:id/verify',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const profile = await Profile.findByIdAndUpdate(
                _req.params.id,
                { $set: { is_verified: true } },
                { new: true }
            );
            if (!profile) {
                res.status(404).json({ success: false, message: 'Profile not found' });
                return;
            }
            res.json({ success: true, data: profile });
        } catch (err) {
            next(err);
        }
    }
);

export default router;
