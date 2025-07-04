import { Timestamp } from 'firebase/firestore';

export type StationStatus = 'active' | 'inactive';
export type VehicleType = 'car' | 'motorbike' | 'bike'; // ✅ Loại phương tiện

export interface Station {
  id: string;
  companyId: string;
  name: string;
  displayAddress: string;
  mapAddress: string;
  location: string; // Ví dụ: "16.07° N, 108.22° E"
  geo?: {
    lat: number;
    lng: number;
  };
  contactPhone?: string;
  vehicleType?: VehicleType; // ✅ Thêm trường này
  status?: StationStatus;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export interface StationFormValues {
  name: string;
  displayAddress: string;
  mapAddress: string;
  location: string;
  geo?: {
    lat: number;
    lng: number;
  };
  contactPhone?: string;
  vehicleType?: VehicleType; // ✅ Thêm vào form nếu cần
}
