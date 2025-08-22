// lib/technicianPartners/technicianPartnerTypes.ts
import { Timestamp, FieldValue } from 'firebase/firestore';
import { LocationCore } from '../locations/locationTypes';

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
  shopAddress?: string;

  // Map / location (CHUẨN MỚI)
  location?: LocationCore;        // ✅ chuẩn duy nhất

  // Nếu vẫn cần ô vùng phủ (tuỳ chọn)
  geoBox?: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };

  // Coverage
  assignedRegions: string[]; // ["DaNang/ThanhKhe/...", ...]

  // Services / vehicle type
  serviceCategories?: string[]; // ["battery", "brake", ...]
  vehicleType?: VehicleType;

  /**
   * ✅ New simplified working time (applies to all days)
   * Format: "HH:mm" 24h, e.g. "08:00", "18:30"
   */
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

  avatarUrl?: string | null;

  /**
   * ⛔️ Deprecated: kept only for backward compatibility during migration.
   * Do not write new data here.
   */
  workingHours?: unknown;
}
