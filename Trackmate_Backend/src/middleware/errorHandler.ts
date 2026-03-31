import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Error as MongooseError } from 'mongoose';

export interface AppError extends Error {
    statusCode?: number;
    code?: number;
}

/**
 * Global Express error handler. Returns consistent JSON error shape.
 */
export const errorHandler = (
    err: AppError,
    _req: Request,
    res: Response,
    _next: NextFunction
): void => {
    // Zod validation errors
    if (err instanceof ZodError) {
        const issues = (err.issues ?? (err as any).errors ?? []) as Array<{ path: (string | number)[]; message: string }>;
        console.error('Zod Validation Error on Route:', _req.method, _req.originalUrl);
        console.error('Zod Issues:', JSON.stringify(issues, null, 2));
        console.error('Request Body: [redacted]');
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: issues.map((e) => ({
                field: e.path.join('.'),
                message: e.message,
            })),
        });
        return;
    }

    // Mongoose duplicate key
    if ((err as any).code === 11000) {
        const field = Object.keys((err as any).keyValue || {})[0] || 'field';
        res.status(409).json({
            success: false,
            message: `${field} already exists`,
        });
        return;
    }

    // Mongoose validation error
    if (err instanceof MongooseError.ValidationError) {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: Object.values(err.errors).map((e) => ({
                field: e.path,
                message: e.message,
            })),
        });
        return;
    }

    // Generic
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : err.message;

    if (statusCode === 500) {
        console.error('💥 Unhandled error:', err);
    }

    res.status(statusCode).json({ success: false, message });
};

/**
 * Helper to create a structured AppError.
 */
export function createError(message: string, statusCode: number): AppError {
    const err: AppError = new Error(message);
    err.statusCode = statusCode;
    return err;
}
