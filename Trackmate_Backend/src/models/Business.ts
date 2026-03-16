import mongoose, { Schema } from 'mongoose';
import { IBusiness, BusinessCategory } from '../types';

const businessSchema = new Schema<IBusiness>(
    {
        owner: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        business_name: { type: String, required: true, trim: true },
        category: { type: String, enum: Object.values(BusinessCategory), required: true },
        description: { type: String },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        address: { type: String },
        zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
        ward: { type: Schema.Types.ObjectId, ref: 'Ward' },
        operating_hours: { type: Schema.Types.Mixed },
        phone: { type: String },
        website: { type: String },
        is_verified: { type: Boolean, default: false },
        is_active: { type: Boolean, default: true },
        logo_url: { type: String },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

businessSchema.index({ owner: 1 });
businessSchema.index({ zone: 1 });
businessSchema.index({ ward: 1 });
businessSchema.index({ is_verified: 1, is_active: 1 });

export const Business = mongoose.model<IBusiness>('Business', businessSchema);
