import { z } from 'zod';

export const accountFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  name: z.string().min(1, 'Full name is required'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().optional(),
  idNumber: z.string().optional(),
  phone: z.string().min(9, 'Phone number is required'),

  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),

  preferences: z.object({
    language: z.string(),
    region: z.string(),
    currency: z.string().optional(),
  }),

  lastKnownLocation: z
    .object({
      lat: z.number({ required_error: 'Latitude is required' }),
      lng: z.number({ required_error: 'Longitude is required' }),
      address: z.string().optional(),
    })
    .optional(),
});
