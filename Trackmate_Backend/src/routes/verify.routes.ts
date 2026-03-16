import express, { Router, Response } from 'express';
import { Profile, Trip } from '../models';

const router: Router = express.Router();

// Public: verify a blockchain ID without authentication
router.get('/:blockchainId', async (req, res: Response, next) => {
    try {
        const profile = await Profile.findOne({ blockchain_id: req.params.blockchainId })
            .select('full_name role blockchain_id id_type id_last_four is_verified created_at')
            .lean();

        if (!profile) {
            res.json({ success: true, data: { valid: false, message: 'Blockchain ID not found' } });
            return;
        }

        let tripInfo = null;
        if (profile.role === 'tourist') {
            const now = new Date();
            const trip = await Trip.findOne({
                tourist: profile._id,
                is_active: true,
                start_date: { $lte: now },
                end_date: { $gte: now },
            })
                .select('destination_region start_date end_date')
                .lean();

            if (trip) {
                tripInfo = {
                    destination_region: trip.destination_region,
                    valid_from: trip.start_date,
                    valid_to: trip.end_date,
                    is_currently_valid: true,
                };
            }
        }

        res.json({
            success: true,
            data: {
                valid: profile.role !== 'tourist' || !!tripInfo,
                name: profile.full_name,
                role: profile.role,
                blockchain_id: profile.blockchain_id,
                is_verified: profile.is_verified,
                issued_at: profile.created_at,
                trip: tripInfo,
            },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
