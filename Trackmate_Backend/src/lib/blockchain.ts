import crypto from 'crypto';

/**
 * Canonical JSON serialisation — sorts keys alphabetically for determinism.
 */
function canonicalJSON(obj: Record<string, unknown>): string {
    return JSON.stringify(obj, Object.keys(obj).sort());
}

const ROLE_PREFIX: Record<string, string> = {
    tourist: 'BC',
    resident: 'RE',
    business: 'BZ',
    authority: 'AU',
    admin: 'AD',
};

export interface BlockchainIdPayload {
    userId: string;
    role: string;
    idHash: string;
    issuedAt: string; // ISO string
    salt: string;
}

/**
 * Generates a deterministic blockchain-style ID from user data.
 * prefixes: BC (tourist), RE (resident), BZ (business), AU (authority)
 */
export function generateBlockchainId(payload: BlockchainIdPayload): string {
    const canonical = canonicalJSON(payload as unknown as Record<string, unknown>);
    const hash = crypto.createHash('sha256').update(canonical).digest('hex');
    const prefix = ROLE_PREFIX[payload.role] ?? 'XX';
    return `${prefix}${hash.substring(0, 16).toUpperCase()}`;
}

/**
 * Verifies a blockchain ID by re-deriving it from the payload.
 */
export function verifyBlockchainId(payload: BlockchainIdPayload, expected: string): boolean {
    return generateBlockchainId(payload) === expected;
}

/**
 * Hashes a government ID number with SHA-256.
 * Returns { hash, lastFour }
 */
export function hashGovernmentId(rawId: string): { hash: string; lastFour: string } {
    const cleaned = rawId.trim().toUpperCase();
    return {
        hash: crypto.createHash('sha256').update(cleaned).digest('hex'),
        lastFour: cleaned.slice(-4),
    };
}

/**
 * Generates a tamper-proof hash for a complete e-FIR payload.
 */
export function generateEFIRHash(efirData: Record<string, unknown>): string {
    const canonical = canonicalJSON(efirData);
    return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Verifies an e-FIR by recomputing and comparing its hash.
 */
export function verifyEFIRHash(efirData: Record<string, unknown>, storedHash: string): boolean {
    return generateEFIRHash(efirData) === storedHash;
}

/**
 * Generic SHA-256 hex hash helper.
 */
export function sha256(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex');
}
