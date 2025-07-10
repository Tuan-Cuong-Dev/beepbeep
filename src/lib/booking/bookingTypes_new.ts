import { Timestamp, FieldValue } from 'firebase/firestore';
import { VehicleType } from '../vehicleModels/vehicleModelTypes_new';
import { ServiceType } from '../vehicleServices/vehicleServiceModelTypes';

export type BookingStatus = 'draft' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking_new {
  id: string;
  userId: string;
  customerId?: string;
  companyId: string;

  vehicleId?: string;
  vehicleModelId?: string;
  vehicleType?: VehicleType;

  serviceType: ServiceType;

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
