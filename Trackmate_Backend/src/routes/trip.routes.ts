import express, { Router, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { Trip, Itinerary } from '../models';
import { AuthRequest, UserRole, ItineraryStopStatus } from '../types';

const router: Router = express.Router();

const tripSchema = z.object({
    destination_region: z.string().min(2),
    start_date: z.string(),
    end_date: z.string(),
    entry_point: z.string().optional(),
    vehicle_details: z.string().optional(),
});

const stopSchema = z.object({
    destination_name: z.string().min(2),
    description: z.string().optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    planned_arrival: z.string().optional(),
    planned_departure: z.string().optional(),
    safety_notes: z.string().optional(),
    contact_name: z.string().optional(),
    contact_phone: z.string().optional(),
    sort_order: z.number().int().nonnegative(),
});

const updateStopSchema = z.object({
    status: z.nativeEnum(ItineraryStopStatus).optional(),
    actual_arrival: z.string().optional(),
    actual_departure: z.string().optional(),
    safety_notes: z.string().optional(),
}).partial();

// ─── Trips ────────────────────────────────────────────────────────────

router.get('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const filter: Record<string, any> = { tourist: req.user!.userId };
        if (req.user!.role === UserRole.AUTHORITY) delete filter.tourist;
        const trips = await Trip.find(filter).sort({ created_at: -1 }).lean();
        res.json({ success: true, data: trips });
    } catch (err) {
        next(err);
    }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const body = tripSchema.parse(req.body);
        const trip = await Trip.create({
            ...body,
            tourist: req.user!.userId,
            start_date: new Date(body.start_date),
            end_date: new Date(body.end_date),
        });
        res.status(201).json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
});

router.patch('/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const updates = tripSchema.partial().parse(req.body);
        const trip = await Trip.findOneAndUpdate(
            { _id: req.params.id, tourist: req.user!.userId },
            { $set: updates },
            { new: true }
        );
        if (!trip) {
            res.status(404).json({ success: false, message: 'Trip not found' });
            return;
        }
        res.json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
});

// ─── Active trip ──────────────────────────────────────────────────────

router.get('/active', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const now = new Date();
        // 1. Try to find a trip currently in progress
        let trip = await Trip.findOne({
            tourist: req.user!.userId,
            is_active: true,
            start_date: { $lte: now },
            end_date: { $gte: now },
        }).lean();

        // 2. Fallback: most recent active trip (upcoming or past)
        if (!trip) {
            trip = await Trip.findOne({
                tourist: req.user!.userId,
                is_active: true,
            }).sort({ created_at: -1 }).lean();
        }

        res.json({ success: true, data: trip });
    } catch (err) {
        next(err);
    }
});

// ─── Itineraries ──────────────────────────────────────────────────────

router.get('/:tripId/itinerary', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const itinerary = await Itinerary.findOne({ trip: req.params.tripId as any })
            .populate({ path: 'stops', options: { sort: { sort_order: 1 } } })
            .lean();
        res.json({ success: true, data: itinerary });
    } catch (err) {
        next(err);
    }
});

router.post('/:tripId/itinerary', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { title, stops } = req.body;
        const itinerary = await Itinerary.create({
            trip: req.params.tripId as any,
            tourist: req.user!.userId,
            title,
        });

        if (Array.isArray(stops) && stops.length > 0) {
            const validStops = stops.map((s: any) => stopSchema.parse(s));
            // Dynamically import ItineraryStop to avoid circular deps
            const { ItineraryStop } = await import('../models');
            await ItineraryStop.insertMany(
                validStops.map((s) => ({ ...s, itinerary: (itinerary as any)._id }))
            );
        }

        const full = await Itinerary.findById(itinerary._id as any)
            .populate({ path: 'stops', options: { sort: { sort_order: 1 } } });
        res.status(201).json({ success: true, data: full });
    } catch (err) {
        next(err);
    }
});

// ─── Itinerary Stops ──────────────────────────────────────────────────

router.post('/itinerary/:itineraryId/stops', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { ItineraryStop } = await import('../models');
        const body = stopSchema.parse(req.body);
        const stop = await ItineraryStop.create({ ...body, itinerary: req.params.itineraryId as any });
        res.status(201).json({ success: true, data: stop });
    } catch (err) {
        next(err);
    }
});

router.patch('/stops/:id', authenticate, async (req: AuthRequest, res: Response, next) => {
    try {
        const { ItineraryStop } = await import('../models');
        const updates = updateStopSchema.parse(req.body);
        const extra: Record<string, any> = {};
        if (updates.actual_arrival) extra.actual_arrival = new Date(updates.actual_arrival);
        if (updates.actual_departure) extra.actual_departure = new Date(updates.actual_departure);

        const stop = await ItineraryStop.findByIdAndUpdate(
            req.params.id,
            { $set: { ...updates, ...extra } },
            { new: true }
        );
        res.json({ success: true, data: stop });
    } catch (err) {
        next(err);
    }
});

export default router;
