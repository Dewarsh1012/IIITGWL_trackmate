import mongoose, { Schema } from 'mongoose';
import { ITrip } from '../types';

const tripSchema = new Schema<ITrip>(
    {
        tourist: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        destination_region: { type: String, required: true, trim: true },
        start_date: { type: Date, required: true },
        end_date: { type: Date, required: true },
        entry_point: { type: String },
        vehicle_details: { type: String },
        is_active: { type: Boolean, default: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

tripSchema.index({ tourist: 1, is_active: 1 });

export const Trip = mongoose.model<ITrip>('Trip', tripSchema);
