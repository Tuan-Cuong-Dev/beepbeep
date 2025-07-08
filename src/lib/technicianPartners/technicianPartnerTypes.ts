// lib/technicianPartners/technicianPartnerTypes.ts
import { Timestamp, FieldValue } from 'firebase/firestore';
import { WorkingHours } from './workingHoursTypes';

export type VehicleType = 'car' | 'motorbike' | 'bike';

export interface TechnicianPartner {
  id?: string;
  userId?: string;
  createdBy: string;

  name: string;
  phone: string;
  email?: string;
  role?: 'technician_partner';

  type: 'shop' | 'mobile';

  shopName?: string;
  shopAddress?: string;

  mapAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  geo?: {
    lat: number;
    lng: number;
  };

  assignedRegions: string[];

  geoBox?: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };

  serviceCategories?: string[];
  vehicleType?: VehicleType;

  workingHours: WorkingHours[];

  averageRating?: number;
  ratingCount?: number;

  isActive: boolean;

  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  avatarUrl?: string;
}
