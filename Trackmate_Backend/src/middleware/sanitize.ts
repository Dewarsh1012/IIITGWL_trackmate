import { NextFunction, Request, Response } from 'express';

function hasUnsafeKey(key: string): boolean {
    return key.startsWith('$') || key.includes('.');
}

function stripControlChars(value: string): string {
    return value.replace(/[\u0000-\u001F\u007F]/g, '');
}

function stripScriptTags(value: string): string {
    return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

function sanitizeString(value: string, key?: string): string {
    const cleaned = stripScriptTags(stripControlChars(value));
    if (key && key.toLowerCase().includes('password')) {
        return cleaned;
    }
    return cleaned.trim();
}

function sanitizeValue(value: unknown, key?: string): unknown {
    if (typeof value === 'string') {
        return sanitizeString(value, key);
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
    }

    if (value && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [entryKey, entryValue] of Object.entries(value as Record<string, unknown>)) {
            if (hasUnsafeKey(entryKey)) {
                continue;
            }
            result[entryKey] = sanitizeValue(entryValue, entryKey);
        }
        return result;
    }

    return value;
}

function applySanitizedObject(
    target: Record<string, unknown>,
    sanitized: Record<string, unknown>
): void {
    for (const key of Object.keys(target)) {
        if (!(key in sanitized)) {
            delete target[key];
        }
    }

    for (const [key, value] of Object.entries(sanitized)) {
        target[key] = value;
    }
}

function setRequestSegment<T extends 'body' | 'query' | 'params'>(
    req: Request,
    segment: T,
    sanitized: Request[T]
): void {
    const current = req[segment];

    if (
        current &&
        typeof current === 'object' &&
        !Array.isArray(current) &&
        sanitized &&
        typeof sanitized === 'object' &&
        !Array.isArray(sanitized)
    ) {
        applySanitizedObject(
            current as Record<string, unknown>,
            sanitized as Record<string, unknown>
        );
        return;
    }

    try {
        req[segment] = sanitized;
    } catch {
        Object.defineProperty(req, segment, {
            value: sanitized,
            writable: true,
            configurable: true,
            enumerable: true,
        });
    }
}

export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
    const sanitizedBody = sanitizeValue(req.body) as Request['body'];
    const sanitizedQuery = sanitizeValue(req.query) as Request['query'];
    const sanitizedParams = sanitizeValue(req.params) as Request['params'];

    setRequestSegment(req, 'body', sanitizedBody);
    setRequestSegment(req, 'query', sanitizedQuery);
    setRequestSegment(req, 'params', sanitizedParams);

    next();
}
