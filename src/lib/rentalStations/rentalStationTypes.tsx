// lib/rentalStations/rentalStationTypes.ts

import { Timestamp, GeoPoint } from 'firebase/firestore';

export interface RentalStation {
  id: string;
  companyId: string;           // 🔗 liên kết với RentalCompany
  name: string;                // Tên trạm cho thuê
  displayAddress: string;      // Địa chỉ hiển thị
  mapAddress: string;          // Địa chỉ dạng Google Maps (chuẩn hóa)
  location: string;            // Tọa độ dạng text: '16.0226° N, 108.1207° E'

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
