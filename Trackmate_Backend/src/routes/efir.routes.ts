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

const voiceDraftSchema = z.object({
    transcript: z.string().min(25).max(12000),
    locale: z.string().optional(),
    incident_hint: z.string().optional(),
});

const voiceDraftResultSchema = z.object({
    title: z.string().min(5).max(140),
    description: z.string().min(20),
    incident_type: z.string().min(2).max(80),
    incident_location: z.string().max(180).optional(),
    incident_time: z.string().optional(),
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

// ─── POST voice transcript -> eFIR draft ────────────────────────────

router.post(
    '/voice-draft',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const body = voiceDraftSchema.parse(req.body);
            const heuristicDraft = buildHeuristicVoiceDraft(body.transcript, body.incident_hint);
            const geminiDraft = await buildGeminiVoiceDraft(body.transcript, body.locale, body.incident_hint);

            const mergedDraftRaw = {
                ...heuristicDraft,
                ...(geminiDraft || {}),
            };

            const mergedDraft = voiceDraftResultSchema.parse({
                ...mergedDraftRaw,
                description: ensureMinLength(mergedDraftRaw.description, 20),
            });

            res.json({
                success: true,
                data: {
                    ...mergedDraft,
                    source: geminiDraft ? 'gemini' : 'heuristic',
                },
            });
        } catch (err) {
            next(err);
        }
    }
);

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

interface GeminiGenerateResponse {
    candidates?: Array<{
        content?: {
            parts?: Array<{ text?: string }>;
        };
    }>;
}

async function buildGeminiVoiceDraft(
    transcript: string,
    locale?: string,
    incidentHint?: string
): Promise<Partial<z.infer<typeof voiceDraftResultSchema>> | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    const timeoutMs = parsePositiveInt(process.env.GEMINI_TIMEOUT_MS, 4500);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const prompt = [
            'You convert emergency voice transcripts into structured police eFIR draft JSON.',
            'Output strict JSON only with keys: title, description, incident_type, incident_location, incident_time, witness_statements.',
            'incident_time must be ISO string if confidently inferred, else omit.',
            'witness_statements must be an array of {name, contact, statement} only when clearly present.',
            `locale=${locale || 'en'}`,
            `incident_hint=${incidentHint || 'none'}`,
            'Transcript:',
            transcript,
        ].join('\n');

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.15,
                        maxOutputTokens: 380,
                    },
                }),
                signal: controller.signal,
            }
        );

        if (!response.ok) return null;
        const payload = (await response.json()) as GeminiGenerateResponse;
        const rawText = payload.candidates?.[0]?.content?.parts
            ?.map((part) => part.text || '')
            .join(' ')
            .trim();

        if (!rawText) return null;
        const parsedJson = tryExtractJsonObject(rawText);
        if (!parsedJson) return null;

        const draft = voiceDraftResultSchema.partial().parse(parsedJson);
        return draft;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function buildHeuristicVoiceDraft(transcript: string, incidentHint?: string): z.infer<typeof voiceDraftResultSchema> {
    const clean = transcript.replace(/\s+/g, ' ').trim();
    const titleSource = clean.split(/[.!?]/).find(Boolean) || clean;
    const shortTitle = titleSource.split(' ').slice(0, 10).join(' ');

    const incidentType = inferIncidentType(clean, incidentHint);
    const location = extractLocation(clean);
    const incidentTime = extractIncidentTime(clean);

    const title = normalizeTitle(shortTitle, incidentType);
    const description = ensureMinLength(clean, 20);

    return {
        title,
        description,
        incident_type: incidentType,
        incident_location: location,
        incident_time: incidentTime,
        witness_statements: [],
    };
}

function inferIncidentType(text: string, hint?: string): string {
    const source = `${hint || ''} ${text}`.toLowerCase();
    if (/theft|stole|stolen|snatch|robber/.test(source)) return 'Theft/Larceny';
    if (/assault|attack|hit|injured|beaten|fight/.test(source)) return 'Assault';
    if (/harass|stalk|threat|abuse/.test(source)) return 'Harassment';
    if (/accident|crash|collision|vehicle/.test(source)) return 'Accident';
    if (/fire|smoke|burn/.test(source)) return 'Fire';
    if (/medical|faint|heart|bleeding|unconscious/.test(source)) return 'Medical Emergency';
    return 'General Safety';
}

function extractLocation(text: string): string | undefined {
    const match = text.match(/(?:at|near|around|in)\s+([a-zA-Z0-9,\-\s]{4,90})/i);
    if (!match) return undefined;
    return match[1].trim().replace(/[.,]$/, '');
}

function extractIncidentTime(text: string): string | undefined {
    const isoMatch = text.match(/\b(20\d{2}-\d{2}-\d{2}[T\s]\d{2}:\d{2}(?::\d{2})?)\b/);
    if (isoMatch) {
        const parsed = new Date(isoMatch[1].replace(' ', 'T'));
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }

    const todayTimeMatch = text.match(/\b(today|tonight|this morning|this evening)\s+at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
    if (todayTimeMatch) {
        const hourRaw = Number(todayTimeMatch[2]);
        const minuteRaw = Number(todayTimeMatch[3] || 0);
        const meridiem = (todayTimeMatch[4] || '').toLowerCase();
        let hour = hourRaw;

        if (meridiem === 'pm' && hour < 12) hour += 12;
        if (meridiem === 'am' && hour === 12) hour = 0;

        const date = new Date();
        date.setHours(hour, minuteRaw, 0, 0);
        return date.toISOString();
    }

    return undefined;
}

function normalizeTitle(candidate: string, incidentType: string): string {
    const trimmed = candidate.trim();
    if (trimmed.length >= 5) {
        return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
    }
    return `Voice FIR: ${incidentType}`;
}

function ensureMinLength(value: string, minLength: number): string {
    if (value.length >= minLength) return value;
    return `${value} ${'Please include additional details for official incident filing.'.slice(0, Math.max(0, minLength - value.length - 1))}`.trim();
}

function tryExtractJsonObject(rawText: string): Record<string, any> | null {
    const start = rawText.indexOf('{');
    const end = rawText.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    const jsonSlice = rawText.slice(start, end + 1);
    try {
        const parsed = JSON.parse(jsonSlice);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as Record<string, any>;
        }
        return null;
    } catch {
        return null;
    }
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
    const value = Number(raw);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return Math.floor(value);
}

export default router;
