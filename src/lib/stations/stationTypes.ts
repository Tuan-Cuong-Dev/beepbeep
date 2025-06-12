// 📁 lib/stations/stationTypes.ts

import { Timestamp } from 'firebase/firestore';

export interface Station {
  id: string;
  companyId: string;
  name: string;
  displayAddress: string;
  mapAddress: string;
  location: string; // "16.07° N, 108.22° E"
  status?: 'active' | 'inactive';
  createdAt?: any;
  updatedAt?: any;
}

export type StationStatus = 'active' | 'inactive' | 'maintenance'; // Có thể dùng để mở rộng về sau

export interface StationFormValues {
  name: string;
  displayAddress: string;
  mapAddress: string;
  location: string;
}
