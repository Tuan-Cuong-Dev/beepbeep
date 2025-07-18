// 📁 lib/batteryStations/batteryStationTypes.ts
import { Timestamp, FieldValue } from 'firebase/firestore';

export type VehicleType = 'car' | 'motorbike'; // ✅ Loại xe hỗ trợ

export interface BatteryStation {
  id: string;
  name: string;
  displayAddress: string;
  mapAddress?: string; // 🌐 Google Maps formatted address (nếu có)
  coordinates?: {
    lat: number;
    lng: number;
  };
  vehicleType?: VehicleType; // ✅ Loại phương tiện được hỗ trợ (car, motorbike)
  isActive: boolean;
  createdBy?: string; // ✅ thêm dòng này
  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
