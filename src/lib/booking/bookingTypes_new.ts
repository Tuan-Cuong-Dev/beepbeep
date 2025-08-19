// Dữ liệu chuẩn cho hạng mục Bookings
// Chưa áp dụng vào file nào cả cập nhật đến 19/08/2025
// Nếu sau này phát triển thêm ở các dòng xe khác thì quay trở lại xem ? 
// Nếu cần thì dùng, ko thì sẽ xóa


import { Timestamp, FieldValue } from 'firebase/firestore';
import { VehicleType } from '../vehicle-models/vehicleModelTypes';
import { VehicleServiceModel } from '../vehicle-services/vehicleServiceModelTypes';

export type BookingStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking_New {
  id: string;
  userId: string;
  customerId?: string;
  companyId: string;
  stationId: string;

  vehicleId?: string;
  vehicleModelId?: string;
  vehicleType?: VehicleType;

  serviceType: VehicleServiceModel;

  startDate: Timestamp;
  endDate: Timestamp;
  durationDays?: number;

  priceTotal?: number;
  depositAmount?: number;
  remainingBalance?: number;

  pickupMethod?: 'store' | 'delivery';
  pickupLocation?: string;
  dropoffLocation?: string;

  driverName?: string;
  driverPhone?: string;

  bookingStatus: BookingStatus;
  statusComment?: string;

  notes?: string;

  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
