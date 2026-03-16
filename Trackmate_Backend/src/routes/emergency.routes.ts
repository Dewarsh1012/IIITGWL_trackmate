import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { EmergencyContact } from '../models';
import { AuthRequest } from '../types';

const router: Router = express.Router();

const contactSchema = z.object({
    name: z.string().min(2).max(100),
    phone: z.string().min(7).max(20),
    relation: z.string().optional(),
    is_primary: z.boolean().optional(),
});

router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const contacts = await EmergencyContact.find({ user: req.user!.userId })
            .sort({ is_primary: -1, created_at: 1 })
            .lean();
        res.json({ success: true, data: contacts });
    } catch (err) {
        next(err);
    }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const body = contactSchema.parse(req.body);
        // If setting as primary, demote others first
        if (body.is_primary) {
            await EmergencyContact.updateMany(
                { user: req.user!.userId },
                { $set: { is_primary: false } }
            );
        }
        const contact = await EmergencyContact.create({ ...body, user: req.user!.userId });
        res.status(201).json({ success: true, data: contact });
    } catch (err) {
        next(err);
    }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const updates = contactSchema.partial().parse(req.body);
        if (updates.is_primary) {
            await EmergencyContact.updateMany(
                { user: req.user!.userId },
                { $set: { is_primary: false } }
            );
        }
        const contact = await EmergencyContact.findOneAndUpdate(
            { _id: req.params.id, user: req.user!.userId },
            { $set: updates },
            { new: true }
        );
        if (!contact) {
            res.status(404).json({ success: false, message: 'Contact not found' });
            return;
        }
        res.json({ success: true, data: contact });
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const contact = await EmergencyContact.findOneAndDelete({
            _id: req.params.id,
            user: req.user!.userId,
        });
        if (!contact) {
            res.status(404).json({ success: false, message: 'Contact not found' });
            return;
        }
        res.json({ success: true, message: 'Contact deleted' });
    } catch (err) {
        next(err);
    }
});

export default router;
