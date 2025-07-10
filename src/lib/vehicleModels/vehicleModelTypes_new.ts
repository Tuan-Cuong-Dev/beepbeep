import { Timestamp, FieldValue } from 'firebase/firestore';

/**
 * Các loại phương tiện mà hệ thống hỗ trợ. _ Bắt đầu từ 10/07/2025
 */
export type VehicleType = 'bike' | 'motorbike' | 'car' | 'van' | 'bus' | 'other';

export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  bike: 'Bicycle',
  motorbike: 'Motorbike',
  car: 'Car',
  van: 'Van / Limo',
  bus: 'Bus / Coach',
  other: 'Other',
};

/**
 * Mô tả một mẫu phương tiện (vehicle model) thuộc về công ty cho thuê.
 */
export interface VehicleModel {
  id: string;
  companyId: string;              // ID công ty sở hữu mẫu xe

  name: string;                   // Tên thương mại, ví dụ: "Klara S", "Ford Transit"
  description: string;           // Mô tả chi tiết
  vehicleType: VehicleType;      // Loại phương tiện

  brand?: string;                // Hãng sản xuất (VinFast, Honda, etc.)
  modelCode?: string;            // Mã kỹ thuật của hãng (tuỳ chọn)

  batteryCapacity?: string;      // Dung lượng pin nếu là xe điện (VD: "72V22Ah")
  motorPower?: number;           // Công suất motor (W)
  fuelType?: 'electric' | 'gasoline' | 'hybrid'; // Loại nhiên liệu

  topSpeed?: number;             // Tốc độ tối đa (km/h)
  range?: number;                // Quãng đường tối đa mỗi lần sạc/đổ xăng (km)
  weight?: number;               // Trọng lượng xe (kg)
  maxLoad?: number;              // Tải trọng tối đa (kg)
  capacity?: number;             // Số chỗ ngồi (ô tô, xe khách...)

  pricePerHour?: number;         // Giá thuê theo giờ
  pricePerDay?: number;          // Giá thuê theo ngày
  pricePerWeek?: number;         // Giá thuê theo tuần
  pricePerMonth?: number;        // Giá thuê theo tháng

  imageUrl?: string;             // Ảnh đại diện mẫu xe
  available: boolean;            // Đang hoạt động hay tạm ngưng

  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
