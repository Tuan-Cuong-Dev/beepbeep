// lib/rentalStations/rentalStationTypes.ts

import { Timestamp, GeoPoint } from 'firebase/firestore';

export interface RentalStation {
  id: string;
  companyId: string;           // 🔗 liên kết với RentalCompany
  name: string;                // Tên trạm cho thuê
  displayAddress: string;      // Địa chỉ hiển thị
  mapAddress: string;          // Địa chỉ dạng Google Maps (chuẩn hóa)
  location: string;            // Tọa độ dạng text: '16.0226° N, 108.1207° E'

  contactPhone?: string;       // ✅ Số điện thoại liên hệ
  vehicleType?: 'bike' | 'motorbike' | 'car'; // ✅ Loại phương tiện hỗ trợ
  geo?: GeoPoint;              // ✅ Tọa độ dạng chuẩn Firestore (dùng để filter trên bản đồ)

  createdBy?: string;          // ✅ Ai đã tạo
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
