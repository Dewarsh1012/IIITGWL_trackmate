import mongoose, { Schema } from 'mongoose';
import { IUserAlert } from '../types';

const userAlertSchema = new Schema<IUserAlert>(
    {
        alert: { type: Schema.Types.ObjectId, ref: 'Alert', required: true },
        user: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        is_read: { type: Boolean, default: false },
        is_acknowledged: { type: Boolean, default: false },
        read_at: { type: Date },
        acknowledged_at: { type: Date },
        delivered_at: { type: Date, default: Date.now },
    },
    {
        timestamps: false,
    }
);

userAlertSchema.index({ user: 1, is_read: 1 });
userAlertSchema.index({ alert: 1, user: 1 }, { unique: true });
userAlertSchema.index({ delivered_at: -1 });

export const UserAlert = mongoose.model<IUserAlert>('UserAlert', userAlertSchema);
