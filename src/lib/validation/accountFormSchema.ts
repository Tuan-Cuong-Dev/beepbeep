import { z } from 'zod';

export const accountFormSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().optional(),
  idNumber: z.string().optional(),
  phone: z.string().min(9, 'Invalid phone'),
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
  lastKnownLocation: z.object({
    lat: z.number(),
    lng: z.number(),
    address: z.string().optional(),
  }).optional(),
});
