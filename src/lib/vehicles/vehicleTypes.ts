// Tạo ngày 08/09 để bắt đầu backup data mới từ ebikeTypes trước đây

// lib/vehicles/vehicleTypes.ts
import { Timestamp } from 'firebase/firestore';

export type VehicleStatus =
  | 'Available'
  | 'In Use'
  | 'Under Maintenance'
  | 'Reserved'
  | 'Sold'
  | 'Broken';

export interface Vehicle {
  id: string;
  modelId: string;
  companyId: string;
  stationId: string;

  serialNumber: string;
  vehicleID: string;
  plateNumber: string;
  odo: number;
  color: string;
  status: VehicleStatus;
  currentLocation: string;
  lastMaintained: Timestamp | null;

  batteryCapacity: string;
  range: number;

  pricePerHour?: number;
  pricePerDay: number;
  pricePerWeek?: number;
  pricePerMonth?: number;

  note?: string;

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}