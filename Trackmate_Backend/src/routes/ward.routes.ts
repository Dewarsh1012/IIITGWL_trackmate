import express, { Router, Response } from 'express';
import { Ward } from '../models';

const router: Router = express.Router();

router.get('/', async (_req, res: Response, next) => {
    try {
        const wards = await Ward.find().lean();
        res.json({ success: true, data: wards });
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res: Response, next) => {
    try {
        const ward = await Ward.findById(req.params.id)
            .populate('ward_officer', 'full_name designation department')
            .lean();
        if (!ward) {
            res.status(404).json({ success: false, message: 'Ward not found' });
            return;
        }
        res.json({ success: true, data: ward });
    } catch (err) {
        next(err);
    }
});

export default router;
