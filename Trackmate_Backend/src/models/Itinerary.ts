import mongoose, { Schema } from 'mongoose';
import { IItinerary, IItineraryStop, ItineraryStopStatus } from '../types';

const itinerarySchema = new Schema<IItinerary>(
    {
        trip: { type: Schema.Types.ObjectId, ref: 'Trip', required: true },
        tourist: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
        title: { type: String, required: true, trim: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

const itineraryStopSchema = new Schema<IItineraryStop>(
    {
        itinerary: { type: Schema.Types.ObjectId, ref: 'Itinerary', required: true },
        destination_name: { type: String, required: true, trim: true },
        description: { type: String },
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        planned_arrival: { type: Date },
        planned_departure: { type: Date },
        actual_arrival: { type: Date },
        actual_departure: { type: Date },
        status: {
            type: String,
            enum: Object.values(ItineraryStopStatus),
            default: ItineraryStopStatus.UPCOMING,
        },
        safety_notes: { type: String },
        contact_name: { type: String },
        contact_phone: { type: String },
        sort_order: { type: Number, required: true },
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: false },
    }
);

itineraryStopSchema.index({ itinerary: 1, sort_order: 1 });

export const Itinerary = mongoose.model<IItinerary>('Itinerary', itinerarySchema);
export const ItineraryStop = mongoose.model<IItineraryStop>('ItineraryStop', itineraryStopSchema);
