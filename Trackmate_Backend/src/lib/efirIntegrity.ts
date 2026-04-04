import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { sha256 } from './blockchain';

export type EvidenceHashAlgo = 'sha256';

export interface EvidenceHashEntry {
    url: string;
    hash_algo: EvidenceHashAlgo;
    hash: string;
}

export interface EvidenceVerificationEntry {
    url: string;
    expectedHash: string;
    computedHash: string;
    hashMatch: boolean;
    source: 'file' | 'url_reference';
}

function normalizeUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}

function isSha256Hash(value: unknown): value is string {
    return typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value.trim());
}

function uniqueStrings(values: string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const value of values) {
        if (seen.has(value)) continue;
        seen.add(value);
        out.push(value);
    }
    return out;
}

function canonicalEvidenceEntries(entries: EvidenceHashEntry[]): EvidenceHashEntry[] {
    return [...entries].sort((a, b) => a.url.localeCompare(b.url));
}

export function normalizeEvidenceIntegrityInput(input: {
    evidence_urls?: unknown;
    evidence_hashes?: unknown;
}): {
    evidenceUrls: string[];
    evidenceHashes: EvidenceHashEntry[];
    evidenceManifestHash?: string;
} {
    const urlsRaw = Array.isArray(input.evidence_urls) ? input.evidence_urls : [];
    const normalizedUrls = uniqueStrings(
        urlsRaw
            .map((value) => normalizeUrl(value))
            .filter((value): value is string => value !== null)
    );

    const hashesRaw = Array.isArray(input.evidence_hashes) ? input.evidence_hashes : [];
    const hashMap = new Map<string, EvidenceHashEntry>();

    for (const raw of hashesRaw) {
        if (!raw || typeof raw !== 'object') continue;
        const item = raw as Record<string, unknown>;
        const url = normalizeUrl(item.url);
        const hash = isSha256Hash(item.hash) ? item.hash.toLowerCase() : null;
        if (!url || !hash) continue;
        hashMap.set(url, {
            url,
            hash_algo: 'sha256',
            hash,
        });
    }

    const evidenceHashes: EvidenceHashEntry[] = normalizedUrls.map((url) => {
        const mapped = hashMap.get(url);
        if (mapped) return mapped;
        // Fallback for remote references: anchor deterministic URL reference hash.
        return {
            url,
            hash_algo: 'sha256',
            hash: sha256(url),
        };
    });

    const sortedHashes = canonicalEvidenceEntries(evidenceHashes);
    const evidenceManifestHash = sortedHashes.length
        ? sha256(JSON.stringify(sortedHashes))
        : undefined;

    return {
        evidenceUrls: normalizedUrls,
        evidenceHashes: sortedHashes,
        evidenceManifestHash,
    };
}

export function mergeEvidenceEntries(
    current: EvidenceHashEntry[],
    incoming: EvidenceHashEntry[]
): EvidenceHashEntry[] {
    const map = new Map<string, EvidenceHashEntry>();
    for (const item of current) map.set(item.url, item);
    for (const item of incoming) map.set(item.url, item);
    return canonicalEvidenceEntries(Array.from(map.values()));
}

function sha256Bytes(bytes: Buffer): string {
    return crypto.createHash('sha256').update(bytes).digest('hex');
}

export async function hashFileContentsSha256(filePath: string): Promise<string> {
    const bytes = await fs.readFile(filePath);
    return sha256Bytes(bytes);
}

export function buildEvidenceManifestHash(entries: EvidenceHashEntry[]): string | undefined {
    const canonical = canonicalEvidenceEntries(entries);
    if (!canonical.length) return undefined;
    return sha256(JSON.stringify(canonical));
}

async function computeEvidenceHash(url: string): Promise<{ hash: string; source: 'file' | 'url_reference' }> {
    if (url.startsWith('/uploads/')) {
        const relative = url.replace(/^\//, '');
        const absolute = path.join(process.cwd(), relative);
        try {
            const bytes = await fs.readFile(absolute);
            return { hash: sha256Bytes(bytes), source: 'file' };
        } catch {
            // If local file is unavailable, verify URL reference hash instead.
            return { hash: sha256(url), source: 'url_reference' };
        }
    }

    return { hash: sha256(url), source: 'url_reference' };
}

export async function verifyEvidenceIntegrity(
    entries: EvidenceHashEntry[]
): Promise<{ verified: boolean; details: EvidenceVerificationEntry[]; manifestHash?: string }> {
    const details: EvidenceVerificationEntry[] = [];

    for (const entry of canonicalEvidenceEntries(entries)) {
        const computed = await computeEvidenceHash(entry.url);
        const expected = entry.hash.toLowerCase();
        const computedHash = computed.hash.toLowerCase();
        details.push({
            url: entry.url,
            expectedHash: expected,
            computedHash,
            hashMatch: expected === computedHash,
            source: computed.source,
        });
    }

    return {
        verified: details.every((item) => item.hashMatch),
        details,
        manifestHash: buildEvidenceManifestHash(entries),
    };
}

function normalizeDateIso(value: unknown): string | undefined {
    if (!value) return undefined;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
    }
    return undefined;
}

function normalizeId(value: unknown): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
        const maybeObject = value as Record<string, unknown>;
        if (typeof maybeObject._id === 'string') return maybeObject._id;
        if (maybeObject._id && typeof maybeObject._id === 'object') {
            const idValue = (maybeObject._id as { toString?: () => string }).toString?.();
            if (idValue) return idValue;
        }
    }

    const asText = (value as { toString?: () => string }).toString?.();
    return asText && asText !== '[object Object]' ? asText : undefined;
}

export function buildEFIRIntegrityPayload(input: Record<string, unknown>): Record<string, unknown> {
    const witnessStatements = Array.isArray(input.witness_statements)
        ? input.witness_statements
            .filter((item) => item && typeof item === 'object')
            .map((item) => {
                const witness = item as Record<string, unknown>;
                return {
                    name: typeof witness.name === 'string' ? witness.name.trim() : '',
                    contact: typeof witness.contact === 'string' ? witness.contact.trim() : '',
                    statement: typeof witness.statement === 'string' ? witness.statement.trim() : '',
                };
            })
            .sort((a, b) => `${a.name}|${a.contact}|${a.statement}`.localeCompare(`${b.name}|${b.contact}|${b.statement}`))
        : [];

    const integrity = normalizeEvidenceIntegrityInput({
        evidence_urls: input.evidence_urls,
        evidence_hashes: input.evidence_hashes,
    });

    return {
        incident: normalizeId(input.incident),
        user: normalizeId(input.user),
        filed_by: normalizeId(input.filed_by),
        title: typeof input.title === 'string' ? input.title.trim() : '',
        description: typeof input.description === 'string' ? input.description.trim() : '',
        incident_type: typeof input.incident_type === 'string' ? input.incident_type.trim() : '',
        incident_location: typeof input.incident_location === 'string' ? input.incident_location.trim() : undefined,
        incident_lat: typeof input.incident_lat === 'number' ? input.incident_lat : undefined,
        incident_lng: typeof input.incident_lng === 'number' ? input.incident_lng : undefined,
        incident_time: normalizeDateIso(input.incident_time),
        status: typeof input.status === 'string' ? input.status : undefined,
        evidence_urls: integrity.evidenceUrls,
        evidence_hashes: integrity.evidenceHashes,
        evidence_manifest_hash: integrity.evidenceManifestHash,
        witness_statements: witnessStatements,
    };
}
