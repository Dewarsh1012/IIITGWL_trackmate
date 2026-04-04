import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { EFIR } from '../models';
import { AuthRequest, UserRole, EFIRStatus } from '../types';
import { generateEFIRHash } from '../lib/blockchain';
import { uploadEvidence, toPublicUploadPath } from '../middleware/upload';
import {
    buildEFIRIntegrityPayload,
    buildEvidenceManifestHash,
    hashFileContentsSha256,
    mergeEvidenceEntries,
    normalizeEvidenceIntegrityInput,
    verifyEvidenceIntegrity,
    EvidenceHashEntry,
} from '../lib/efirIntegrity';
import { anchorEFIRToLedger, isLedgerReadConfigured, readEFIRFromLedger, updateEFIRStatusOnLedger } from '../lib/efirLedger';

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
    evidence_hashes: z.array(
        z.object({
            url: z.string().min(1),
            hash_algo: z.literal('sha256').optional(),
            hash: z.string().regex(/^[a-f0-9]{64}$/i),
        })
    ).optional(),
    witness_statements: z.array(z.object({
        name: z.string(),
        contact: z.string(),
        statement: z.string().min(10),
    })).optional(),
});

const evidenceMutationSchema = z
    .object({
        urls: z.array(z.string().min(1)).optional(),
        hashes: z
            .array(
                z.object({
                    url: z.string().min(1),
                    hash_algo: z.literal('sha256').optional(),
                    hash: z.string().regex(/^[a-f0-9]{64}$/i),
                })
            )
            .optional(),
    })
    .refine((value) => (value.urls?.length || 0) + (value.hashes?.length || 0) > 0, {
        message: 'Provide at least one evidence URL or hash entry',
    });

const IMMUTABLE_AFTER_SUBMISSION_FIELDS = new Set([
    'incident',
    'user',
    'title',
    'description',
    'incident_type',
    'incident_location',
    'incident_lat',
    'incident_lng',
    'incident_time',
    'evidence_urls',
    'evidence_hashes',
    'witness_statements',
]);

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
            const evidenceIntegrity = normalizeEvidenceIntegrityInput({
                evidence_urls: body.evidence_urls ?? body.evidence_hashes?.map((item) => item.url),
                evidence_hashes: body.evidence_hashes,
            });

            const efir = await EFIR.create({
                ...body,
                filed_by: req.user!.userId,
                incident_time: body.incident_time ? new Date(body.incident_time) : undefined,
                status: EFIRStatus.DRAFT,
                evidence_urls: evidenceIntegrity.evidenceUrls,
                evidence_hashes: evidenceIntegrity.evidenceHashes,
                evidence_manifest_hash: evidenceIntegrity.evidenceManifestHash,
                ledger_anchor_status: 'not_configured',
            });
            res.status(201).json({ success: true, data: efir });
        } catch (err) {
            next(err);
        }
    }
);

// ─── POST add evidence references + hashes (draft only) ──────────────

router.post(
    '/:id/evidence',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const body = evidenceMutationSchema.parse(req.body);
            const efir = await EFIR.findOne({ _id: req.params.id, filed_by: req.user!.userId });

            if (!efir) {
                res.status(404).json({ success: false, message: 'eFIR not found' });
                return;
            }

            if (efir.status !== EFIRStatus.DRAFT) {
                res.status(409).json({ success: false, message: 'Evidence can only be modified while eFIR is in draft status' });
                return;
            }

            const existingIntegrity = normalizeEvidenceIntegrityInput({
                evidence_urls: efir.evidence_urls,
                evidence_hashes: efir.evidence_hashes,
            });

            const incomingIntegrity = normalizeEvidenceIntegrityInput({
                evidence_urls: body.urls ?? body.hashes?.map((item) => item.url),
                evidence_hashes: body.hashes,
            });

            const mergedEvidenceHashes = mergeEvidenceEntries(existingIntegrity.evidenceHashes, incomingIntegrity.evidenceHashes);
            const evidenceUrls = mergedEvidenceHashes.map((item) => item.url);
            const evidenceManifestHash = buildEvidenceManifestHash(mergedEvidenceHashes);

            efir.set({
                evidence_urls: evidenceUrls,
                evidence_hashes: mergedEvidenceHashes,
                evidence_manifest_hash: evidenceManifestHash,
            });
            await efir.save();

            res.json({ success: true, data: efir });
        } catch (err) {
            next(err);
        }
    }
);

// ─── POST upload evidence files + content hashes (draft only) ───────

router.post(
    '/:id/evidence/upload',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        uploadEvidence(req as any, res as any, async (uploadErr: any) => {
            if (uploadErr) {
                res.status(400).json({ success: false, message: uploadErr.message || 'Upload failed' });
                return;
            }

            try {
                const efir = await EFIR.findOne({ _id: req.params.id, filed_by: req.user!.userId });
                if (!efir) {
                    res.status(404).json({ success: false, message: 'eFIR not found' });
                    return;
                }

                if (efir.status !== EFIRStatus.DRAFT) {
                    res.status(409).json({ success: false, message: 'Evidence can only be modified while eFIR is in draft status' });
                    return;
                }

                const files = ((req as any).files || []) as Express.Multer.File[];
                if (!files.length) {
                    res.status(400).json({ success: false, message: 'No evidence files uploaded' });
                    return;
                }

                const uploadedHashes: EvidenceHashEntry[] = [];
                for (const file of files) {
                    const url = toPublicUploadPath(file.path);
                    const hash = await hashFileContentsSha256(file.path);
                    uploadedHashes.push({ url, hash_algo: 'sha256', hash });
                }

                const existingIntegrity = normalizeEvidenceIntegrityInput({
                    evidence_urls: efir.evidence_urls,
                    evidence_hashes: efir.evidence_hashes,
                });

                const mergedEvidenceHashes = mergeEvidenceEntries(existingIntegrity.evidenceHashes, uploadedHashes);
                const evidenceUrls = mergedEvidenceHashes.map((item) => item.url);
                const evidenceManifestHash = buildEvidenceManifestHash(mergedEvidenceHashes);

                efir.set({
                    evidence_urls: evidenceUrls,
                    evidence_hashes: mergedEvidenceHashes,
                    evidence_manifest_hash: evidenceManifestHash,
                });
                await efir.save();

                res.status(201).json({
                    success: true,
                    data: efir,
                    uploaded: uploadedHashes,
                });
            } catch (err) {
                next(err);
            }
        });
    }
);

// ─── PATCH update eFIR ────────────────────────────────────────────────

router.patch(
    '/:id',
    authenticate,
    requireRole(UserRole.AUTHORITY, UserRole.ADMIN),
    async (req: AuthRequest, res: Response, next) => {
        try {
            const updates = efirSchema.partial().parse(req.body) as Record<string, unknown>;
            const existing = await EFIR.findOne({ _id: req.params.id, filed_by: req.user!.userId }).lean();
            if (!existing) {
                res.status(404).json({ success: false, message: 'eFIR not found' });
                return;
            }

            if (existing.status !== EFIRStatus.DRAFT && hasImmutableContentUpdates(updates)) {
                res.status(409).json({
                    success: false,
                    message: 'Submitted eFIR content is immutable. Only status transitions are allowed.',
                });
                return;
            }

            const requestedStatus = typeof req.body?.status === 'string' ? req.body.status : undefined;
            const existingIntegrity = normalizeEvidenceIntegrityInput({
                evidence_urls: existing.evidence_urls,
                evidence_hashes: existing.evidence_hashes,
            });

            const includesEvidenceFields =
                Object.prototype.hasOwnProperty.call(updates, 'evidence_urls') ||
                Object.prototype.hasOwnProperty.call(updates, 'evidence_hashes');

            const incomingIntegrity = normalizeEvidenceIntegrityInput({
                evidence_urls: updates.evidence_urls ?? (Array.isArray(updates.evidence_hashes)
                    ? updates.evidence_hashes
                        .map((item) => (item && typeof item === 'object' ? (item as Record<string, unknown>).url : undefined))
                        .filter((item): item is string => typeof item === 'string')
                    : undefined),
                evidence_hashes: updates.evidence_hashes,
            });

            const mergedEvidenceHashes = includesEvidenceFields
                ? mergeEvidenceEntries(existingIntegrity.evidenceHashes, incomingIntegrity.evidenceHashes)
                : existingIntegrity.evidenceHashes;

            const extra: Record<string, unknown> = {
                evidence_urls: mergedEvidenceHashes.map((item) => item.url),
                evidence_hashes: mergedEvidenceHashes,
                evidence_manifest_hash: buildEvidenceManifestHash(mergedEvidenceHashes),
            };

            if (requestedStatus && requestedStatus !== existing.status) {
                if (requestedStatus === EFIRStatus.SUBMITTED) {
                    const integrityPayload = buildEFIRIntegrityPayload({
                        ...existing,
                        ...updates,
                        ...extra,
                        status: EFIRStatus.SUBMITTED,
                    });

                    const localHash = generateEFIRHash(integrityPayload);
                    const firNumber = asOptionalString(existing.ledger_fir_number) || `EFIR-${String(existing._id)}`;

                    extra.status = EFIRStatus.SUBMITTED;
                    extra.blockchain_hash = localHash;
                    extra.ledger_fir_number = firNumber;
                    extra.ledger_anchor_status = 'pending';
                    extra.ledger_anchor_error = undefined;

                    const anchorResult = await anchorEFIRToLedger({
                        firNumber,
                        dataHash: localHash,
                    });

                    if (anchorResult.status === 'anchored') {
                        extra.ledger_anchor_status = 'anchored';
                        extra.ledger_tx_hash = anchorResult.txHash;
                        extra.ledger_chain_id = anchorResult.chainId;
                        extra.ledger_anchored_at = new Date();
                    } else if (anchorResult.status === 'failed') {
                        extra.ledger_anchor_status = 'failed';
                        extra.ledger_anchor_error = anchorResult.error || 'Unable to anchor eFIR hash on ledger';
                    } else {
                        extra.ledger_anchor_status = 'not_configured';
                        extra.ledger_anchor_error = 'Ledger write configuration is missing; local hash verification remains available';
                    }
                } else {
                    extra.status = requestedStatus;

                    const firNumber = asOptionalString(existing.ledger_fir_number);
                    if (firNumber && existing.status !== EFIRStatus.DRAFT) {
                        const statusResult = await updateEFIRStatusOnLedger({
                            firNumber,
                            status: requestedStatus,
                        });

                        if (statusResult.status === 'failed') {
                            extra.ledger_anchor_error = statusResult.error || 'Failed to sync eFIR status on ledger';
                        } else if (statusResult.status === 'updated') {
                            extra.ledger_tx_hash = statusResult.txHash;
                            extra.ledger_anchor_status = 'anchored';
                            extra.ledger_anchor_error = undefined;
                        }
                    }
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

        const integrityPayload = buildEFIRIntegrityPayload({ ...efir, status: efir.status || EFIRStatus.SUBMITTED });
        const localComputedHash = generateEFIRHash(integrityPayload);
        const localPayloadVerified = localComputedHash.toLowerCase() === efir.blockchain_hash.toLowerCase();

        const evidenceHashes = normalizeEvidenceIntegrityInput({
            evidence_urls: efir.evidence_urls,
            evidence_hashes: efir.evidence_hashes,
        }).evidenceHashes;

        const evidenceResult = await verifyEvidenceIntegrity(evidenceHashes);

        const ledgerFirNumber = asOptionalString(efir.ledger_fir_number);
        let ledgerData: Awaited<ReturnType<typeof readEFIRFromLedger>> = null;
        let ledgerHashVerified: boolean | null = null;

        if (ledgerFirNumber && isLedgerReadConfigured()) {
            ledgerData = await readEFIRFromLedger(ledgerFirNumber);
            if (ledgerData) {
                ledgerHashVerified = ledgerData.dataHash.toLowerCase() === efir.blockchain_hash.toLowerCase();
            }
        }

        const verified = localPayloadVerified && evidenceResult.verified && (ledgerHashVerified ?? true);
        res.json({
            success: true,
            data: {
                verified,
                storedHash: efir.blockchain_hash,
                localComputedHash,
                localPayloadVerified,
                evidenceManifestHash: efir.evidence_manifest_hash,
                evidenceVerified: evidenceResult.verified,
                evidenceDetails: evidenceResult.details,
                ledger: {
                    configured: isLedgerReadConfigured(),
                    firNumber: ledgerFirNumber,
                    found: Boolean(ledgerData),
                    hashVerified: ledgerHashVerified,
                    dataHash: ledgerData?.dataHash,
                    status: ledgerData?.status,
                    timestamp: ledgerData?.timestamp,
                    complainant: ledgerData?.complainant,
                },
                message: verified
                    ? '✓ eFIR payload, evidence manifest, and ledger hash checks passed'
                    : '✗ Integrity verification failed — inspect payload/evidence/ledger details',
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

function asOptionalString(value: unknown): string | undefined {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed.length ? trimmed : undefined;
    }

    if (value == null) return undefined;
    const cast = (value as { toString?: () => string }).toString?.();
    if (!cast || cast === '[object Object]') return undefined;
    const trimmed = cast.trim();
    return trimmed.length ? trimmed : undefined;
}

function hasImmutableContentUpdates(updates: Record<string, unknown>): boolean {
    return Object.keys(updates).some((key) => IMMUTABLE_AFTER_SUBMISSION_FIELDS.has(key));
}

export default router;
