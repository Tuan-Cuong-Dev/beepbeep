import { Timestamp, FieldValue } from 'firebase/firestore';

// 🚘 Loại phương tiện
export type VehicleType = 'bike' | 'motorbike' | 'car' | 'van' | 'bus' | 'other';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  bike: 'Bicycle',
  motorbike: 'Motorbike',
  car: 'Car',
  van: 'Van / Limo',
  bus: 'Bus / Coach',
  other: 'Other',
};

// 🛠️ Loại dịch vụ áp dụng
export type ServiceType =
  | 'rental_self_drive'    // Thuê tự lái
  | 'rental_with_driver'   // Thuê có tài xế
  | 'carpool'              // Đi ké
  | 'shared_trip'          // Đi chung
  | 'fixed_route'          // Tuyến cố định
  | 'wedding'              // Cưới hỏi
  | 'tour'                 // Tour du lịch
  | 'delivery'             // Giao xe
  | 'repair'               // Sửa chữa
  | 'insurance';           // Bảo hiểm

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  rental_self_drive: 'Self-drive rental',
  rental_with_driver: 'Rental with driver',
  carpool: 'Carpool (xe ké)',
  shared_trip: 'Shared trip',
  fixed_route: 'Fixed route',
  wedding: 'Wedding service',
  tour: 'Tour service',
  delivery: 'Vehicle delivery',
  repair: 'Repair service',
  insurance: 'Vehicle insurance',
};

// 📦 Giao diện mẫu phương tiện + dịch vụ
export interface VehicleServiceModel {
  id: string;
  companyId: string;

  name: string;
  description: string;
  imageUrl?: string;

  vehicleType: VehicleType;
  serviceTypes: ServiceType[];
  available: boolean;

  capacity?: number;             // Số chỗ ngồi (car, van, bus)
  luggageCapacity?: string;     // Thể tích khoang hành lý

  pricePerTrip?: number;
  pricePerDay?: number;
  pricePerHour?: number;

  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
