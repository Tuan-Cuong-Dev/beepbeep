import { Timestamp } from "firebase/firestore";
// Dữ liệu chuẩn cho hạng mục Bookings chuyên cho xe máy

export interface Booking {
  id: string;
  companyId: string;
  stationId: string;
  userId?: string;

  idImage?: string;
  fullName: string;
  channel?: string;
  phone: string;
  idNumber: string;
  address: string;

  vehicleSearch?: string;
  vehicleModel: string;
  vehicleColor: string;
  vin: string;
  licensePlate?: string;

  batteryCode1?: string;
  batteryCode2?: string;
  batteryCode3?: string;
  batteryCode4?: string;

  rentalStartDate: Timestamp;
  rentalStartHour: string;
  rentalDays: number;
  rentalEndDate: Timestamp;

  package?: string;
  basePrice: number;
  batteryFee?: number;
  totalAmount: number;
  deposit: number;
  remainingBalance: number;

  deliveryMethod: 'Pickup at Shop' | 'Deliver to Address';
  deliveryAddress?: string;

  helmet?: boolean;
  charger?: boolean;
  phoneHolder?: boolean;
  rearRack?: boolean;
  raincoat?: boolean;

  note?: string;

  bookingStatus: 'draft' | 'confirmed' | 'returned' | 'completed' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;

  statusComment?: string;
}

  export type SubmitResult =
    | { status: 'success'; booking: Booking }
    | { status: 'validation_error' }
    | { status: 'error' };
