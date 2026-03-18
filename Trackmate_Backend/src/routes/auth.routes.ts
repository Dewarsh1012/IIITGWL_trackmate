import express, { Router, Response } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { Profile, PlatformConfig, Ward, Trip } from '../models';
import { generateBlockchainId, hashGovernmentId } from '../lib/blockchain';
import { authenticate } from '../middleware/auth';
import { authRateLimiter, resetRateLimit } from '../middleware/rateLimiter';
import { UserRole, IdType, AuthRequest } from '../types';

const router: Router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BLOCKCHAIN_SALT = process.env.BLOCKCHAIN_SALT!;
const AUTHORITY_CODE = process.env.AUTHORITY_CODE!;

// ─── Validation Schemas ───────────────────────────────────────────────

const baseRegisterSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    full_name: z.string().min(2).max(100),
    phone: z.string().optional(),
    role: z.nativeEnum(UserRole),
    preferred_language: z.string().optional(),
});

const touristExtras = z.object({
    id_type: z.nativeEnum(IdType),
    id_number: z.string().min(4),
    start_date: z.string(),
    end_date: z.string(),
    destination_region: z.string().min(2),
    entry_point: z.string().optional(),
});

const residentExtras = z.object({
    ward_id: z.string().optional(),
});

const businessExtras = z.object({
    ward_id: z.string().optional(),
});

const authorityExtras = z.object({
    designation: z.string().min(2),
    department: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

// ─── Helpers ─────────────────────────────────────────────────────────

function signTokens(userId: string, role: UserRole, email: string) {
    const accessToken = jwt.sign({ userId, role, email }, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
    });
    return { accessToken };
}

// ─── Register ────────────────────────────────────────────────────────

router.post('/register', authRateLimiter, async (req, res: Response, next) => {
    try {
        const base = baseRegisterSchema.parse(req.body);

        // Role-specific extra validation
        let extras: Record<string, any> = {};
        if (base.role === UserRole.TOURIST) {
            extras = touristExtras.parse(req.body);
        } else if (base.role === UserRole.RESIDENT) {
            extras = residentExtras.parse(req.body);
        } else if (base.role === UserRole.BUSINESS) {
            extras = businessExtras.parse(req.body);
        } else if (base.role === UserRole.AUTHORITY) {
            extras = authorityExtras.parse(req.body);
        }

        const existing = await Profile.findOne({ email: base.email });
        if (existing) {
            res.status(409).json({ success: false, message: 'Email already registered' });
            return;
        }

        // Hash government ID for tourists
        let id_number_hash: string | undefined;
        let id_last_four: string | undefined;
        let idHash = base.phone || base.email;

        if (base.role === UserRole.TOURIST && extras.id_number) {
            const hashed = hashGovernmentId(extras.id_number);
            id_number_hash = hashed.hash;
            id_last_four = hashed.lastFour;
            idHash = hashed.hash;
        }

        // Build profile
        const profile = new Profile({
            email: base.email,
            password: base.password,
            role: base.role,
            full_name: base.full_name,
            phone: base.phone,
            id_type: extras.id_type,
            id_number_hash,
            id_last_four,
            preferred_language: base.preferred_language || 'en',
            ward: extras.ward_id || undefined,
            designation: extras.designation,
            department: extras.department,
        });

        await profile.save();

        // Generate blockchain ID
        const blockchain_id = generateBlockchainId({
            userId: profile._id.toString(),
            role: base.role,
            idHash,
            issuedAt: profile.created_at.toISOString(),
            salt: BLOCKCHAIN_SALT,
        });

        profile.blockchain_id = blockchain_id;
        await profile.save();

        // Tourist: create initial trip
        let trip = null;
        if (base.role === UserRole.TOURIST && extras.start_date) {
            trip = await Trip.create({
                tourist: profile._id,
                destination_region: extras.destination_region,
                start_date: new Date(extras.start_date),
                end_date: new Date(extras.end_date),
                entry_point: extras.entry_point,
                is_active: true,
            });
        }

        const { accessToken } = signTokens(
            profile._id.toString(),
            profile.role,
            profile.email
        );

        resetRateLimit(req);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                accessToken,
                blockchainId: blockchain_id,
                user: {
                    id: profile._id,
                    email: profile.email,
                    full_name: profile.full_name,
                    role: profile.role,
                    blockchain_id,
                    safety_score: profile.safety_score,
                    preferred_language: profile.preferred_language,
                },
                trip: trip ? { id: trip._id, destination_region: trip.destination_region } : null,
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── Login ────────────────────────────────────────────────────────────

router.post('/login', authRateLimiter, async (req, res: Response, next) => {
    try {
        const { email, password } = loginSchema.parse(req.body);

        const profile = await Profile.findOne({ email }).select('+password');
        if (!profile || !profile.is_active) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        const isMatch = await profile.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
            return;
        }

        const { accessToken } = signTokens(
            profile._id.toString(),
            profile.role,
            profile.email
        );

        resetRateLimit(req);

        res.json({
            success: true,
            data: {
                accessToken,
                user: {
                    id: profile._id,
                    email: profile.email,
                    full_name: profile.full_name,
                    role: profile.role,
                    blockchain_id: profile.blockchain_id,
                    safety_score: profile.safety_score,
                    preferred_language: profile.preferred_language,
                    is_verified: profile.is_verified,
                    ward: profile.ward,
                },
            },
        });
    } catch (err) {
        next(err);
    }
});

// ─── Get current user ─────────────────────────────────────────────────

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

// ─── Verify token (lightweight) ───────────────────────────────────────

router.get('/verify-token', authenticate, (req: AuthRequest, res: Response) => {
    res.json({ success: true, data: req.user });
});

export default router;
