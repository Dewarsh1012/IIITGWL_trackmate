import mongoose, { Schema } from 'mongoose';
import { IEFIR, EFIRStatus } from '../types';

const efirSchema = new Schema<IEFIR>(
    {
        incident: { type: Schema.Types.ObjectId, ref: 'Incident' },
        user: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        filed_by: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        title: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        incident_type: { type: String, required: true },
        incident_location: { type: String },
        incident_lat: { type: Number },
        incident_lng: { type: Number },
        incident_time: { type: Date },
        status: { type: String, enum: Object.values(EFIRStatus), default: EFIRStatus.DRAFT },
        evidence_urls: [{ type: String }],
        evidence_hashes: [
            {
                url: { type: String, required: true },
                hash_algo: { type: String, enum: ['sha256'], default: 'sha256' },
                hash: { type: String, required: true },
            },
        ],
        evidence_manifest_hash: { type: String },
        blockchain_hash: { type: String },
        ledger_fir_number: { type: String, index: true },
        ledger_tx_hash: { type: String },
        ledger_chain_id: { type: String },
        ledger_anchor_status: { type: String, enum: ['not_configured', 'pending', 'anchored', 'failed'] },
        ledger_anchor_error: { type: String },
        ledger_anchored_at: { type: Date },
        witness_statements: [
            {
                name: { type: String },
                contact: { type: String },
                statement: { type: String },
            },
        ],
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    }
);

efirSchema.index({ incident: 1 });
efirSchema.index({ user: 1 });
efirSchema.index({ filed_by: 1 });
efirSchema.index({ status: 1 });

export const EFIR = mongoose.model<IEFIR>('EFIR', efirSchema);
