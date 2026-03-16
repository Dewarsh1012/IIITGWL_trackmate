import mongoose, { Schema } from 'mongoose';
import { ILocationLog } from '../types';

const locationLogSchema = new Schema<ILocationLog>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        accuracy_meters: { type: Number },
        speed: { type: Number },
        heading: { type: Number },
        battery_level: { type: Number },
        is_in_safe_zone: { type: Boolean, default: true },
        current_zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
        current_ward: { type: Schema.Types.ObjectId, ref: 'Ward' },
        source: { type: String, default: 'gps', enum: ['gps', 'iot_band', 'manual'] },
        recorded_at: { type: Date, default: Date.now },
    },
    {
        timestamps: false,
    }
);

// Composite index for efficient user+time queries
locationLogSchema.index({ user: 1, recorded_at: -1 });
locationLogSchema.index({ current_zone: 1 });
locationLogSchema.index({ recorded_at: 1 }); // for TTL / pruning queries

export const LocationLog = mongoose.model<ILocationLog>('LocationLog', locationLogSchema);
