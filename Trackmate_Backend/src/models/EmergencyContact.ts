import mongoose, { Schema } from 'mongoose';
import { IEmergencyContact } from '../types';

const emergencyContactSchema = new Schema<IEmergencyContact>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        relation: { type: String },
        is_primary: { type: Boolean, default: false },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

emergencyContactSchema.index({ user: 1 });

export const EmergencyContact = mongoose.model<IEmergencyContact>(
    'EmergencyContact',
    emergencyContactSchema
);
