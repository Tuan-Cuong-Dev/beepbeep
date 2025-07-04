import { Timestamp,FieldValue } from 'firebase/firestore';
import { WorkingHours } from './workingHoursTypes';
export type VehicleType = 'car' | 'motorbike' | 'bike'; // ✅ Thêm type nếu chưa có


export interface TechnicianPartner {
  id?: string; // Firebase auto-generated ID
  userId?: string; // Linked to Firebase Auth user
  createdBy: string; // Creator's userId (Technician Assistant)

  name: string;
  phone: string;
  email?: string;
  role?: 'technician_partner'; // Role for Firebase Auth logic

  // Type of technician
  type: 'shop' | 'mobile';

  // Shop-specific info
  shopName?: string;
  shopAddress?: string;

  // Google Maps location
  mapAddress?: string; // 🌐 New field: Google Maps link or formatted address
  coordinates?: {
    lat: number;
    lng: number;
  };

  geo?: {
    lat: number;
    lng: number;
  };

  // Self-declared service regions
  assignedRegions: string[];

  // Geo box assigned by assistant/admin
  geoBox?: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };

  // Types of services the partner can handle
  serviceCategories?: string[];
  
  // ✅ Thêm loại phương tiện phục vụ
  vehicleType?: VehicleType;

  // Weekly availability
  workingHours: WorkingHours[];

  // Customer/system feedback
  averageRating?: number;
  ratingCount?: number;

  isActive: boolean;

  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
  avatarUrl?: string; // ✅ thêm dòng này
}
