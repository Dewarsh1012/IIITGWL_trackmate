import { z } from 'zod';


export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Base fields — no .refine() here so .extend() works properly
const baseFields = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
});

// Helper to add password match refinement
function withPasswordMatch<T extends typeof baseFields>(schema: T) {
  return schema.refine(data => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  });
}

export const touristRegisterSchema = withPasswordMatch(
  baseFields.extend({
    id_type: z.enum(['aadhaar', 'passport', 'voter_id', 'driving_license']),
    id_number: z.string().min(5, 'ID number required'),
    destination_region: z.string().min(2, 'Destination required'),
    trip_start_date: z.string().min(1, 'Start date required'),
    trip_end_date: z.string().min(1, 'End date required'),
  })
);

export const residentRegisterSchema = withPasswordMatch(
  baseFields.extend({
    ward_id: z.string().optional(),
  })
);

export const businessRegisterSchema = withPasswordMatch(
  baseFields.extend({
    business_name: z.string().min(2, 'Business name required'),
    category: z.enum(['accommodation', 'food_beverage', 'transport', 'medical', 'retail', 'tour_operator', 'other']),
    address: z.string().min(5, 'Address required'),
    ward_id: z.string().optional(),
  })
);

export const authorityRegisterSchema = withPasswordMatch(
  baseFields.extend({
    designation: z.string().min(2, 'Designation required'),
    department: z.string().min(2, 'Department required'),
  })
);

// Infer types
export type LoginInput = z.infer<typeof loginSchema>;
export type TouristRegisterInput = z.infer<typeof touristRegisterSchema>;
export type ResidentRegisterInput = z.infer<typeof residentRegisterSchema>;
export type BusinessRegisterInput = z.infer<typeof businessRegisterSchema>;
export type AuthorityRegisterInput = z.infer<typeof authorityRegisterSchema>;
