import { Timestamp, FieldValue } from 'firebase/firestore';

export type VehicleType = 'car' | 'motorbike';
export type PlaceType = 'cafe' | 'restaurant' | 'home' | 'shop';

export interface BatteryChargingStation {
  id: string;

  // Địa điểm
  name: string;
  displayAddress: string;
  mapAddress: string;
  phone: string;

  coordinates?: {
    lat: number;
    lng: number;
  };

  vehicleType?: VehicleType;
  placeType?: PlaceType;

  // Sạc cơ bản
  chargingPorts?: number;
  chargingPowerKW?: number;
  chargingStandard?: string;

  // Mô tả dịch vụ
  description?: string;

  isActive: boolean;

  // Metadata
  createdBy?: string;
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
