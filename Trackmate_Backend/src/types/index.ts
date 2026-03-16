import { Request } from 'express';
import { Document, Types } from 'mongoose';

// ── Enums ──
export enum UserRole {
    TOURIST = 'tourist',
    RESIDENT = 'resident',
    BUSINESS = 'business',
    AUTHORITY = 'authority',
    ADMIN = 'admin',
}

export enum IdType {
    AADHAAR = 'aadhaar',
    PASSPORT = 'passport',
    VOTER_ID = 'voter_id',
    DRIVING_LICENSE = 'driving_license',
}

export enum AlertSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

export enum AlertStatus {
    ACTIVE = 'active',
    ACKNOWLEDGED = 'acknowledged',
    ASSIGNED = 'assigned',
    ESCALATED = 'escalated',
    RESOLVED = 'resolved',
    FALSE_ALARM = 'false_alarm',
}

export enum AlertSource {
    SOS_PANIC = 'sos_panic',
    ZONE_BREACH = 'zone_breach',
    AI_ANOMALY = 'ai_anomaly',
    RESIDENT_REPORT = 'resident_report',
    AUTHORITY_MANUAL = 'authority_manual',
    IOT_BAND = 'iot_band',
}

export enum ZoneRiskLevel {
    SAFE = 'safe',
    MODERATE = 'moderate',
    HIGH = 'high',
    RESTRICTED = 'restricted',
}

export enum EFIRStatus {
    DRAFT = 'draft',
    SUBMITTED = 'submitted',
    UNDER_REVIEW = 'under_review',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

export enum ItineraryStopStatus {
    UPCOMING = 'upcoming',
    CURRENT = 'current',
    COMPLETED = 'completed',
    SKIPPED = 'skipped',
}

export enum BusinessCategory {
    ACCOMMODATION = 'accommodation',
    FOOD_BEVERAGE = 'food_beverage',
    TRANSPORT = 'transport',
    MEDICAL = 'medical',
    RETAIL = 'retail',
    TOUR_OPERATOR = 'tour_operator',
    OTHER = 'other',
}

// ── Document Interfaces ──
export interface IProfile extends Document {
    _id: Types.ObjectId;
    email: string;
    password: string;
    role: UserRole;
    full_name: string;
    phone?: string;
    avatar_url?: string;
    blockchain_id?: string;
    id_type?: IdType;
    id_number_hash?: string;
    id_last_four?: string;
    safety_score: number;
    preferred_language: string;
    ward?: Types.ObjectId;
    is_verified: boolean;
    is_active: boolean;
    designation?: string;
    department?: string;
    created_at: Date;
    updated_at: Date;
    comparePassword(password: string): Promise<boolean>;
}

export interface IWard extends Document {
    name: string;
    district: string;
    state: string;
    center_lat: number;
    center_lng: number;
    geojson?: object;
    ward_officer?: Types.ObjectId;
    created_at: Date;
}

export interface IZone extends Document {
    name: string;
    description?: string;
    risk_level: ZoneRiskLevel;
    center_lat: number;
    center_lng: number;
    radius_meters: number;
    geojson?: object;
    managed_by?: Types.ObjectId;
    is_active: boolean;
    auto_alert: boolean;
    created_at: Date;
}

export interface ILocationLog extends Document {
    user: Types.ObjectId;
    latitude: number;
    longitude: number;
    accuracy_meters?: number;
    speed?: number;
    heading?: number;
    battery_level?: number;
    is_in_safe_zone: boolean;
    current_zone?: Types.ObjectId;
    current_ward?: Types.ObjectId;
    source: string;
    recorded_at: Date;
}

export interface IIncident extends Document {
    reporter?: Types.ObjectId;
    incident_type: string;
    title: string;
    description?: string;
    latitude?: number;
    longitude?: number;
    zone?: Types.ObjectId;
    ward?: Types.ObjectId;
    severity: AlertSeverity;
    status: AlertStatus;
    source: AlertSource;
    assigned_to?: Types.ObjectId;
    resolved_by?: Types.ObjectId;
    resolved_at?: Date;
    evidence_urls: string[];
    metadata: Record<string, any>;
    is_public: boolean;
    created_at: Date;
}

export interface ITrip extends Document {
    tourist: Types.ObjectId;
    destination_region: string;
    start_date: Date;
    end_date: Date;
    entry_point?: string;
    vehicle_details?: string;
    is_active: boolean;
    created_at: Date;
}

export interface IItinerary extends Document {
    trip: Types.ObjectId;
    tourist: Types.ObjectId;
    title: string;
    created_at: Date;
}

export interface IItineraryStop extends Document {
    itinerary: Types.ObjectId;
    destination_name: string;
    description?: string;
    latitude: number;
    longitude: number;
    planned_arrival?: Date;
    planned_departure?: Date;
    actual_arrival?: Date;
    actual_departure?: Date;
    status: ItineraryStopStatus;
    safety_notes?: string;
    contact_name?: string;
    contact_phone?: string;
    sort_order: number;
    created_at: Date;
}

export interface IBusiness extends Document {
    owner: Types.ObjectId;
    business_name: string;
    category: BusinessCategory;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    zone?: Types.ObjectId;
    ward?: Types.ObjectId;
    operating_hours?: Record<string, any>;
    phone?: string;
    website?: string;
    is_verified: boolean;
    is_active: boolean;
    logo_url?: string;
    created_at: Date;
}

export interface IEmergencyContact extends Document {
    user: Types.ObjectId;
    name: string;
    phone: string;
    relation?: string;
    is_primary: boolean;
    created_at: Date;
}

export interface IEFIR extends Document {
    incident?: Types.ObjectId;
    user: Types.ObjectId;
    filed_by: Types.ObjectId;
    title: string;
    description: string;
    incident_type: string;
    incident_location?: string;
    incident_lat?: number;
    incident_lng?: number;
    incident_time?: Date;
    status: EFIRStatus;
    evidence_urls: string[];
    blockchain_hash?: string;
    witness_statements: Array<{
        name: string;
        contact: string;
        statement: string;
    }>;
    created_at: Date;
    updated_at: Date;
}

export interface IPlatformConfig extends Document {
    key: string;
    value: string;
    created_at: Date;
}

// ── Auth Types ──
export interface JwtPayload {
    userId: string;
    role: UserRole;
    email: string;
}

export interface AuthRequest extends Request {
    user?: JwtPayload;
}
