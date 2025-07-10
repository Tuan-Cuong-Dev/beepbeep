import { Timestamp, FieldValue } from 'firebase/firestore';

export type VehicleType = 'scooter' | 'bike' | 'cargo' | 'other';

export const VEHICLE_TYPES = ['All', 'Scooter', 'Bike', 'Cargo', 'Other'] as const;

export interface EbikeModel {
  id: string;
  companyId: string;
  name: string;
  description: string;

  batteryCapacity: string;  // e.g. "72V22Ah"
  motorPower: number;       // W
  topSpeed: number;         // km/h
  range: number;            // km
  weight: number;           // kg
  maxLoad?: number;         // kg

  pricePerDay: number;
  pricePerHour?: number;
  pricePerWeek?: number;
  pricePerMonth?: number;

  imageUrl?: string;
  available: boolean;
  type?: VehicleType;

  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
