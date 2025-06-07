import { Timestamp } from "firebase/firestore";
import { Booking } from "./BookingTypes";

export const initialBooking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'> = {
  companyId: '',
  stationId: '',
  userId: '',

  idImage: '',
  fullName: '',
  channel: '',
  phone: '',
  idNumber: '',
  address: '',

  vehicleSearch: '',
  vehicleModel: '',
  vehicleColor: '',
  vin: '',
  licensePlate: '',

  batteryCode1: '',
  batteryCode2: '',
  batteryCode3: '',
  batteryCode4: '',

  rentalStartDate: Timestamp.now(),
  rentalStartHour: '09:00',
  rentalDays: 1,
  rentalEndDate: Timestamp.now(),

  package: '',
  basePrice: 0,
  batteryFee: 0,
  totalAmount: 0,
  deposit: 0,
  remainingBalance: 0,

  deliveryMethod: 'Pickup at Shop',
  deliveryAddress: '',

  helmet: false,
  charger: false,
  phoneHolder: false,
  rearRack: false,
  raincoat: false,

  note: '',

  bookingStatus: 'draft',
};
