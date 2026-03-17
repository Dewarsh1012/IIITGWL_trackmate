export type UserRole = 'tourist' | 'resident' | 'business' | 'authority' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name: string;
  business_name?: string;
  is_active?: boolean;
  role: UserRole;
  blockchain_id?: string;
  safety_score?: number;
  preferred_language?: string;
  is_verified?: boolean;
  ward?: any;
  phone?: string;
  avatar_url?: string;
  designation?: string;
  department?: string;
  created_at?: string;
}

export interface Zone {
  _id: string;
  name: string;
  description?: string;
  risk_level: 'safe' | 'moderate' | 'high' | 'restricted';
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
  auto_alert: boolean;
  managed_by?: any;
}

export interface Incident {
  _id: string;
  reporter?: any;
  incident_type: string;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  zone?: any;
  ward?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'assigned' | 'escalated' | 'resolved' | 'false_alarm';
  source: string;
  assigned_to?: any;
  resolved_by?: any;
  resolved_at?: string;
  evidence_urls?: string[];
  metadata?: any;
  is_public?: boolean;
  created_at: string;
}

export interface Trip {
  _id: string;
  tourist: string;
  destination_region: string;
  start_date: string;
  end_date: string;
  entry_point?: string;
  vehicle_details?: string;
  is_active: boolean;
  created_at: string;
}

export interface EFIR {
  _id: string;
  incident?: any;
  user: any;
  filed_by: any;
  title: string;
  description: string;
  incident_type: string;
  incident_location?: string;
  incident_lat?: number;
  incident_lng?: number;
  incident_time?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'resolved' | 'closed';
  evidence_urls?: string[];
  blockchain_hash?: string;
  witness_statements?: { name: string; contact: string; statement: string }[];
  created_at: string;
}

export interface Business {
  _id: string;
  owner: any;
  business_name: string;
  category: string;
  description?: string;
  latitude: number;
  longitude: number;
  address?: string;
  zone?: any;
  ward?: any;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
}

export interface EmergencyContact {
  _id: string;
  user: string;
  name: string;
  phone: string;
  relation?: string;
  is_primary: boolean;
}

export interface AnalyticsSummary {
  totalUsers: number;
  openIncidents: number;
  sosLastHour: number;
  activeUsersToday: number;
}
