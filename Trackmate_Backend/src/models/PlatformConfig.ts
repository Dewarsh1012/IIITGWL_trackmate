import mongoose, { Schema } from 'mongoose';
import { IPlatformConfig } from '../types';

const platformConfigSchema = new Schema<IPlatformConfig>(
    {
        key: { type: String, required: true, unique: true },
        value: { type: String, required: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

export const PlatformConfig = mongoose.model<IPlatformConfig>(
    'PlatformConfig',
    platformConfigSchema
);
