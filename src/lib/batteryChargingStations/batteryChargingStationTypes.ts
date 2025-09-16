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
  phone: string;
  vehicleType?: VehicleType;
  description?: string;
  
  // Địa chỉ trạm đổi pin
  displayAddress: string;
  mapAddress: string;
  coordinates?: Coordinates;


  isActive: boolean;
  // Metadata
  createdBy?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
