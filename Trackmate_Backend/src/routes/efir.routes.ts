import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { EFIR } from '../models';
import { AuthRequest, UserRole, EFIRStatus } from '../types';
import { generateEFIRHash, verifyEFIRHash } from '../lib/blockchain';

const router: Router = express.Router();

const efirSchema = z.object({
    incident: z.string().optional(),
    user: z.string(), // subject
    title: z.string().min(5),
    description: z.string().min(20),
    incident_type: z.string().min(2),
    incident_location: z.string().optional(),
    incident_lat: z.number().optional(),
    incident_lng: z.number().optional(),
    incident_time: z.string().optional(),
    evidence_urls: z.array(z.string()).optional(),
    witness_statements: z.array(z.object({
        name: z.string(),
        contact: z.string(),
        statement: z.string().min(10),
    })).optional(),
});

// ─── GET — list eFIRs ─────────────────────────────────────────────────

router.get(
    '/',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (_req: AuthRequest, res: Response, next) => {
        try {
            const efirs = await EFIR.find()
                .populate('user', 'full_name role blockchain_id')
                .populate('filed_by', 'full_name designation')
                .populate('incident', 'title incident_type severity')
                .sort({ created_at: -1 })
                .lean();
            res.json({ success: true, data: efirs });
        } catch (err) {
            next(err);
        }
    }
);

// ─── GET subject's own eFIRs ──────────────────────────────────────────

router.get('/me', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const efirs = await EFIR.find({ user: req.user!.userId })
            .populate('filed_by', 'full_name designation')
            .sort({ created_at: -1 })
            .lean();
        res.json({ success: true, data: efirs });
    } catch (err) {
        next(err);
    }
});

// ─── GET single eFIR ──────────────────────────────────────────────────

router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const efir = await EFIR.findById(req.params.id)
            .populate('user', 'full_name role blockchain_id')
            .populate('filed_by', 'full_name designation department')
            .populate('incident', 'title incident_type severity status')
            .lean();
        if (!efir) {
            res.status(404).json({ success: false, message: 'eFIR not found' });
            return;
        }
        res.json({ success: true, data: efir });
    } catch (err) {
        next(err);
    }
});

// ─── POST create eFIR ─────────────────────────────────────────────────

router.post(
    '/',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const body = efirSchema.parse(req.body);
            const efir = await EFIR.create({
                ...body,
                filed_by: req.user!.userId,
                incident_time: body.incident_time ? new Date(body.incident_time) : undefined,
                status: EFIRStatus.DRAFT,
            });
            res.status(201).json({ success: true, data: efir });
        } catch (err) {
            next(err);
        }
    }
);

// ─── PATCH update eFIR ────────────────────────────────────────────────

router.patch(
    '/:id',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const updates = efirSchema.partial().parse(req.body);
            const extra: Record<string, any> = {};

            // If submitting — generate blockchain hash
            if (req.body.status === EFIRStatus.SUBMITTED) {
                const existing = await EFIR.findById(req.params.id).lean();
                if (existing) {
                    const payload: Record<string, any> = {
                        ...existing,
                        ...updates,
                        status: EFIRStatus.SUBMITTED,
                    };
                    // Remove non-deterministic fields
                    delete payload._id;
                    delete payload.__v;
                    delete payload.created_at;
                    delete payload.updated_at;
                    delete payload.blockchain_hash;
                    extra.blockchain_hash = generateEFIRHash(payload);
                    extra.status = EFIRStatus.SUBMITTED;
                }
            }

            const efir = await EFIR.findOneAndUpdate(
                { _id: req.params.id, filed_by: req.user!.userId },
                { $set: { ...updates, ...extra } },
                { new: true, runValidators: true }
            );
            if (!efir) {
                res.status(404).json({ success: false, message: 'eFIR not found' });
                return;
            }
            res.json({ success: true, data: efir });
        } catch (err) {
            next(err);
        }
    }
);

// ─── POST verify blockchain hash ──────────────────────────────────────

router.post('/:id/verify-hash', authenticate, async (_req: AuthRequest, res: Response, next) => {
    try {
        const efir = await EFIR.findById(_req.params.id).lean();
        if (!efir) {
            res.status(404).json({ success: false, message: 'eFIR not found' });
            return;
        }
        if (!efir.blockchain_hash) {
            res.json({ success: true, data: { verified: false, message: 'This eFIR has not been submitted yet' } });
            return;
        }

        const payload: Record<string, any> = { ...efir };
        delete payload._id;
        delete payload.__v;
        delete payload.created_at;
        delete payload.updated_at;
        delete payload.blockchain_hash;

        const verified = verifyEFIRHash(payload, efir.blockchain_hash);
        res.json({
            success: true,
            data: {
                verified,
                storedHash: efir.blockchain_hash,
                message: verified
                    ? '✓ Document integrity verified — this eFIR has not been tampered with'
                    : '✗ Hash mismatch — this eFIR may have been altered',
            },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
