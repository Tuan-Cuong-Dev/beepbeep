// 📁 lib/stations/stationTypes.ts
import { Timestamp } from 'firebase/firestore';

export type StationStatus = 'active' | 'inactive';

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
  contactPhone?: string; // ✅ Mới thêm
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
  contactPhone?: string; // ✅ Mới thêm
}
