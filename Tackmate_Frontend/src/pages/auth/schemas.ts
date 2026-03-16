import { z } from 'zod';


export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const baseRegisterSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirm_password: z.string(),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  role: z.enum(['tourist', 'resident', 'business', 'authority'] as const),
}).refine(data => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ['confirm_password'],
});

export const touristRegisterSchema = baseRegisterSchema.extend({
  id_type: z.enum(['aadhaar', 'passport', 'voter_id', 'driving_license']),
  id_number: z.string().min(5, 'ID number required'),
  destination_region: z.string().min(2, 'Destination required'),
  trip_start_date: z.string().min(10, 'Start date required'),
  trip_end_date: z.string().min(10, 'End date required'),
});

export const residentRegisterSchema = baseRegisterSchema.extend({
  ward_id: z.string().length(24, 'Valid Ward ID required'), // MongoDB ObjectId string
});

export const businessRegisterSchema = baseRegisterSchema.extend({
  business_name: z.string().min(2, 'Business name required'),
  category: z.enum(['accommodation', 'food_beverage', 'transport', 'medical', 'retail', 'tour_operator', 'other']),
  address: z.string().min(5, 'Address required'),
  ward_id: z.string().length(24, 'Valid Ward ID required'),
});

export const authorityRegisterSchema = baseRegisterSchema.extend({
  designation: z.string().min(2, 'Designation required'),
  department: z.string().min(2, 'Department required'),
  authority_code: z.string().min(5, 'Authority Code required'),
});

// Infer types
export type LoginInput = z.infer<typeof loginSchema>;
export type TouristRegisterInput = z.infer<typeof touristRegisterSchema>;
export type ResidentRegisterInput = z.infer<typeof residentRegisterSchema>;
export type BusinessRegisterInput = z.infer<typeof businessRegisterSchema>;
export type AuthorityRegisterInput = z.infer<typeof authorityRegisterSchema>;
