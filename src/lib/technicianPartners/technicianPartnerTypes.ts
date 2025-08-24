// 📁 lib/technicianPartners/technicianPartnerTypes.ts
import { Timestamp, FieldValue } from 'firebase/firestore';
import type { LocationCore } from '@/src/lib/locations/locationTypes'; // ← chỉnh path nếu file ở /common

export type VehicleType = 'car' | 'motorbike' | 'bike';

export interface TechnicianPartner {
  id?: string;
  userId?: string;

  name: string;
  phone: string;
  email?: string;
  role?: 'technician_partner';

  type: 'shop' | 'mobile';

  // Shop fields
  shopName?: string;

  // 📍 CHUẨN DUY NHẤT
  location: LocationCore;

  // Coverage
  assignedRegions: string[]; // nên set [] khi khởi tạo

  // Optional geo box
  geoBox?: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };

  // Services / vehicle type
  serviceCategories?: string[];
  vehicleType?: VehicleType;

  // Working time
  workingStartTime?: string;
  workingEndTime?: string;

  // Ratings
  averageRating?: number;
  ratingCount?: number;

  // Status
  isActive: boolean;

  // Audit
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;

  avatarUrl?: string;

  /** ⛔️ Deprecated – bắt lỗi compile nếu còn dùng */
  coordinates?: never;
  mapAddress?: never;
  geo?: never;

  /** ⛔️ Deprecated giữ cho tới khi cleanup xong */
  workingHours?: unknown;
}
