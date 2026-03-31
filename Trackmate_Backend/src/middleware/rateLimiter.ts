import { Request, Response, NextFunction } from 'express';

interface AttemptRecord {
    count: number;
    resetAt: number; // unix ms
}

interface RateLimitOptions {
    maxAttempts: number;
    windowMs: number;
    keyPrefix: string;
    message?: string;
}

const attempts = new Map<string, AttemptRecord>();

const AUTH_MAX_ATTEMPTS = 10;
const AUTH_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

const API_MAX_ATTEMPTS = 300;
const API_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const UPLOAD_MAX_ATTEMPTS = 30;
const UPLOAD_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getIP(req: Request): string {
    return (
        (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
        req.ip ||
        req.socket.remoteAddress ||
        'unknown'
    );
}

function withRateLimit(options: RateLimitOptions) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const now = Date.now();
        const key = `${options.keyPrefix}:${getIP(req)}`;
        const record = attempts.get(key);

        if (!record || now > record.resetAt) {
            attempts.set(key, { count: 1, resetAt: now + options.windowMs });
            next();
            return;
        }

        record.count++;

        if (record.count > options.maxAttempts) {
            const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
            res.status(429).json({
                success: false,
                message:
                    options.message ||
                    `Too many requests. Try again in ${retryAfterSec} seconds.`,
                retryAfter: retryAfterSec,
            });
            return;
        }

        next();
    };
}

/**
 * Rate limiter for auth endpoints.
 * Allows MAX_ATTEMPTS per IP per WINDOW_MS before blocking.
 */
export const authRateLimiter = withRateLimit({
    maxAttempts: AUTH_MAX_ATTEMPTS,
    windowMs: AUTH_WINDOW_MS,
    keyPrefix: 'auth',
    message: 'Too many authentication attempts. Please try again later.',
});

/**
 * Global API limiter for non-authenticated and authenticated API traffic.
 */
export const apiRateLimiter = withRateLimit({
    maxAttempts: API_MAX_ATTEMPTS,
    windowMs: API_WINDOW_MS,
    keyPrefix: 'api',
});

/**
 * Upload-specific limiter to mitigate abuse of file endpoints.
 */
export const uploadRateLimiter = withRateLimit({
    maxAttempts: UPLOAD_MAX_ATTEMPTS,
    windowMs: UPLOAD_WINDOW_MS,
    keyPrefix: 'upload',
    message: 'Too many upload requests. Please slow down and try again later.',
});

/**
 * Optional utility to clear stale entries (can be invoked by a cron/task later).
 */
export const pruneRateLimitStore = (): void => {
    const now = Date.now();
    for (const [key, record] of attempts.entries()) {
        if (now > record.resetAt) {
            attempts.delete(key);
        }
    }
};
