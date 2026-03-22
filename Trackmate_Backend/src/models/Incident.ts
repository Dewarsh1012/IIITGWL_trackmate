import mongoose, { Schema } from 'mongoose';
import { IIncident, AlertSeverity, AlertStatus, AlertSource } from '../types';

const incidentSchema = new Schema<IIncident>(
    {
        reporter: { type: Schema.Types.ObjectId, ref: 'Profile' },
        incident_type: {
            type: String,
            required: true,
            enum: [
                'crime', 'accident', 'medical_emergency', 'infrastructure_hazard',
                'missing_person', 'suspicious_activity', 'crowd_emergency',
                'natural_disaster', 'fire', 'route_deviation', 'zone_breach',
                'unusual_speed', 'inactivity', 'incident_cluster', 'sos_emergency'
            ],
        },
        title: { type: String, required: true, trim: true },
        description: { type: String },
        latitude: { type: Number },
        longitude: { type: Number },
        zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
        ward: { type: Schema.Types.ObjectId, ref: 'Ward' },
        severity: { type: String, enum: Object.values(AlertSeverity), required: true },
        status: { type: String, enum: Object.values(AlertStatus), default: AlertStatus.ACTIVE },
        source: { type: String, enum: Object.values(AlertSource), required: true },
        assigned_to: { type: Schema.Types.ObjectId, ref: 'Profile' },
        resolved_by: { type: Schema.Types.ObjectId, ref: 'Profile' },
        resolved_at: { type: Date },
        evidence_urls: [{ type: String }],
        metadata: { type: Schema.Types.Mixed, default: {} },
        is_public: { type: Boolean, default: false },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ zone: 1 });
incidentSchema.index({ ward: 1 });
incidentSchema.index({ reporter: 1 });
incidentSchema.index({ created_at: -1 });
incidentSchema.index({ latitude: 1, longitude: 1 });

export const Incident = mongoose.model<IIncident>('Incident', incidentSchema);
