import { Timestamp, FieldValue } from 'firebase/firestore';

export type VehicleType = 'car' | 'motorbike';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BatteryChargingStation {
  id: string;

  // Basic Info
  name: string;
  displayAddress: string;
  mapAddress: string;
  phone: string;
  vehicleType?: VehicleType;
  coordinates?: Coordinates;
  description?: string;
  isActive: boolean;

  // Metadata
  createdBy?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
