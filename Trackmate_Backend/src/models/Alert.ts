import mongoose, { Schema } from 'mongoose';
import { IAlert, AlertPriority, AlertTargetGroup } from '../types';

const alertSchema = new Schema<IAlert>(
    {
        created_by: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        title: { type: String, required: true, trim: true, maxlength: 80 },
        message: { type: String, required: true, trim: true, maxlength: 500 },
        alert_type: {
            type: String,
            required: true,
            enum: ['emergency', 'safety_warning', 'weather', 'traffic', 'zone_update', 'curfew', 'evacuation', 'general'],
        },
        priority: { type: String, enum: Object.values(AlertPriority), required: true },
        target_group: { type: String, enum: Object.values(AlertTargetGroup), required: true },
        target_user_id: { type: Schema.Types.ObjectId, ref: 'Profile' },
        target_zone_id: { type: Schema.Types.ObjectId, ref: 'Zone' },
        scheduled_for: { type: Date },
        sent_at: { type: Date },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

alertSchema.index({ created_at: -1 });
alertSchema.index({ priority: 1 });
alertSchema.index({ target_group: 1 });

export const Alert = mongoose.model<IAlert>('Alert', alertSchema);
