import mongoose, { Schema, CallbackWithoutResultAndOptionalError } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IProfile, UserRole, IdType } from '../types';

const profileSchema = new Schema<IProfile>(
    {
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, select: false },
        role: { type: String, enum: Object.values(UserRole), required: true },
        full_name: { type: String, required: true, trim: true },
        phone: { type: String, trim: true },
        avatar_url: { type: String },
        blockchain_id: { type: String, unique: true, sparse: true },
        id_type: { type: String, enum: Object.values(IdType) },
        id_number_hash: { type: String },
        id_last_four: { type: String },
        safety_score: { type: Number, default: 100, min: 0, max: 100 },
        preferred_language: { type: String, default: 'en' },
        ward: { type: Schema.Types.ObjectId, ref: 'Ward' },
        is_verified: { type: Boolean, default: false },
        is_active: { type: Boolean, default: true },
        designation: { type: String },
        department: { type: String },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

// Hash password before saving
// eslint-disable-next-line @typescript-eslint/no-explicit-any
profileSchema.pre('save', async function (this: any, next: any) {
    if (!this.isModified('password')) { next(); return; }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare password method
profileSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
};

// Index for queries
profileSchema.index({ role: 1 });
profileSchema.index({ ward: 1 });
profileSchema.index({ blockchain_id: 1 });

export const Profile = mongoose.model<IProfile>('Profile', profileSchema);
