import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
    count: number;
    resetAt: number; // unix ms
}

const attempts = new Map<string, AttemptRecord>();
const MAX_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

function getIP(req: Request): string {
    return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.socket.remoteAddress ||
        'unknown'
    );
}

/**
 * Rate limiter for auth endpoints.
 * Allows MAX_ATTEMPTS per IP per WINDOW_MS before blocking.
 */
export const authRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
    const ip = getIP(req);
    const now = Date.now();

    const record = attempts.get(ip);

    if (!record || now > record.resetAt) {
        // Fresh window
        attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
        next();
        return;
    }

    record.count++;

    if (record.count > MAX_ATTEMPTS) {
        const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
        res.status(429).json({
            success: false,
            message: `Too many attempts. Try again in ${retryAfterSec} seconds.`,
            retryAfter: retryAfterSec,
        });
        return;
    }

    next();
};

/**
 * Resets the rate limit counter for an IP (call on successful auth).
 */
export const resetRateLimit = (req: Request): void => {
    attempts.delete(getIP(req));
};
