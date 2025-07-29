// lib/vehicle-services/vehicleTypes.ts
// ✅ Chuẩn hóa theo SupportedServiceType & ServiceCategoryKey – Ngày 29/07/2025
// 📦 Giao diện mô tả dịch vụ theo phương tiện

import { Timestamp, FieldValue } from 'firebase/firestore';
import type { SupportedServiceType, ServiceCategoryKey } from './serviceTypes';

// 🚘 Loại phương tiện hỗ trợ
export type VehicleType = 'bike' | 'motorbike' | 'car' | 'van' | 'bus' | 'other';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  bike: 'Bicycle',
  motorbike: 'Motorbike',
  car: 'Car',
  van: 'Van / Limo',
  bus: 'Bus / Coach',
  other: 'Other',
};

// 📦 Giao diện mô tả dịch vụ theo phương tiện
export interface VehicleServiceModel {
  id: string;
  companyId: string;

  name: string;
  description: string;
  imageUrl?: string;

  vehicleType: VehicleType;
  serviceTypes: SupportedServiceType[]; // ✅ Dùng type chuẩn
  available: boolean;

  category?: ServiceCategoryKey; // ✅ Nhóm dịch vụ chính

  capacity?: number;             // Số chỗ ngồi (car, van, bus)
  luggageCapacity?: string;     // Thể tích khoang hành lý

  pricePerTrip?: number;
  pricePerDay?: number;
  pricePerHour?: number;

  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
