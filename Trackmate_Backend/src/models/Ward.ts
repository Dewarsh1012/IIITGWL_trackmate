import mongoose, { Schema } from 'mongoose';
import { IWard } from '../types';

const wardSchema = new Schema<IWard>(
    {
        name: { type: String, required: true, trim: true },
        district: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        center_lat: { type: Number, required: true },
        center_lng: { type: Number, required: true },
        geojson: { type: Schema.Types.Mixed },
        ward_officer: { type: Schema.Types.ObjectId, ref: 'Profile' },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

export const Ward = mongoose.model<IWard>('Ward', wardSchema);
