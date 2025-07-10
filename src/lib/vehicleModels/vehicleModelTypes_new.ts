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
 * Phân loại phụ cho từng loại phương tiện (hiển thị cụ thể hơn)
 */
export const VEHICLE_SUBTYPE_OPTIONS = [
  // 🚲 Bicycle
  { label: 'Road Bike', value: 'roadbike', vehicleType: 'bike' },
  { label: 'Mountain Bike', value: 'mountainbike', vehicleType: 'bike' },
  { label: 'City Bike', value: 'citybike', vehicleType: 'bike' },
  { label: 'Folding Bike', value: 'foldingbike', vehicleType: 'bike' },
  { label: 'Fat Bike', value: 'fatbike', vehicleType: 'bike' },
  { label: 'Tandem Bike', value: 'tandem', vehicleType: 'bike' },
  { label: 'Electric Bike (eBike)', value: 'ebike', vehicleType: 'bike' },
  { label: 'Cargo Bike', value: 'cargobike', vehicleType: 'bike' },

  // 🛵 Motorbike
  { label: 'Scooter', value: 'scooter', vehicleType: 'motorbike' },
  { label: 'Cub / Underbone', value: 'cub', vehicleType: 'motorbike' },
  { label: 'Manual Motorbike', value: 'manualbike', vehicleType: 'motorbike' },
  { label: '3-Wheel Motorbike', value: 'tricycle', vehicleType: 'motorbike' },
  { label: 'Electric Motorbike', value: 'emotorbike', vehicleType: 'motorbike' },
  { label: 'Electric Scooter', value: 'escooter', vehicleType: 'motorbike' },

  // 🚗 Car
  { label: 'Hatchback', value: 'hatchback', vehicleType: 'car' },
  { label: 'Sedan', value: 'sedan', vehicleType: 'car' },
  { label: 'SUV', value: 'suv', vehicleType: 'car' },
  { label: 'Crossover', value: 'crossover', vehicleType: 'car' },
  { label: 'Pickup Truck', value: 'pickup', vehicleType: 'car' },
  { label: 'Electric Car', value: 'electriccar', vehicleType: 'car' },

  // 🚐 Van / Limo
  { label: 'Mini Van', value: 'minivan', vehicleType: 'van' },
  { label: 'Van', value: 'van', vehicleType: 'van' },
  { label: 'Limousine', value: 'limousine', vehicleType: 'van' },

  // 🚌 Bus
  { label: 'Minibus', value: 'minibus', vehicleType: 'bus' },
  { label: 'Coach', value: 'coach', vehicleType: 'bus' },
  { label: 'Sleeper Bus', value: 'sleeperbus', vehicleType: 'bus' },

  // 🚜 Other
  { label: 'ATV / Quad Bike', value: 'atv', vehicleType: 'other' },
  { label: 'Golf Cart', value: 'golfcart', vehicleType: 'other' },
  { label: 'Truck / Lorry', value: 'truck', vehicleType: 'other' },
  { label: 'Trailer', value: 'trailer', vehicleType: 'other' },
  { label: 'Other', value: 'other', vehicleType: 'other' },
] as const;

export const VEHICLE_SUBTYPE_LABELS: Record<string, string> = VEHICLE_SUBTYPE_OPTIONS.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {} as Record<string, string>);


/**
 * Loại nhiên liệu sử dụng cho phương tiện
 */
export type FuelType = 'electric' | 'gasoline' | 'hybrid';

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  electric: 'Electric',
  gasoline: 'Gasoline',
  hybrid: 'Hybrid',
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
  vehicleSubType?: string;       // Phân loại chi tiết hơn

  brand?: string;                // Hãng sản xuất (VinFast, Honda, etc.)
  modelCode?: string;            // Mã kỹ thuật của hãng (tuỳ chọn)

  batteryCapacity?: string;      // Dung lượng pin nếu là xe điện (VD: "72V22Ah")
  motorPower?: number;           // Công suất motor (W)
  fuelType?: FuelType;           // Loại nhiên liệu

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
