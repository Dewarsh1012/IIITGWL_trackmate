import express, { Response, Router } from 'express';
import { authenticate } from '../middleware/auth';
import { uploadRateLimiter } from '../middleware/rateLimiter';
import { uploadEvidence, uploadSingle, toPublicUploadPath } from '../middleware/upload';
import { AuthRequest } from '../types';

const router: Router = express.Router();

router.post('/evidence', authenticate, uploadRateLimiter, (req: AuthRequest, res: Response) => {
    uploadEvidence(req as any, res as any, (err: any) => {
        if (err) {
            res.status(400).json({ success: false, message: err.message || 'Upload failed' });
            return;
        }

        const files = ((req as any).files || []) as Express.Multer.File[];
        const urls = files.map((file) => toPublicUploadPath(file.path));

        res.status(201).json({ success: true, data: { urls, count: urls.length } });
    });
});

router.post('/file', authenticate, uploadRateLimiter, (req: AuthRequest, res: Response) => {
    uploadSingle(req as any, res as any, (err: any) => {
        if (err) {
            res.status(400).json({ success: false, message: err.message || 'Upload failed' });
            return;
        }

        const file = (req as any).file as Express.Multer.File | undefined;
        if (!file) {
            res.status(400).json({ success: false, message: 'No file uploaded' });
            return;
        }

        res.status(201).json({ success: true, data: { url: toPublicUploadPath(file.path) } });
    });
});

export default router;
