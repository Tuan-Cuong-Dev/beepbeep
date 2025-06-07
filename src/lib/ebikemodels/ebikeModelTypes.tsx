// lib/ebikeModels/ebikeModelTypes.ts
import { Timestamp, FieldValue } from "firebase/firestore";

export interface EbikeModel {
  id: string;
  companyId: string;          // 🔗 chủ sở hữu (company hoặc private)
  name: string;               // Tên thương mại model
  description: string;

  batteryCapacity: string;    // Định dạng ví dụ: "72V22Ah"
  motorPower: number;         // W
  topSpeed: number;           // Km/h
  range: number;              // Km
  weight: number;             // Kg
  maxLoad?: number;           // Kg (nếu cần)

  pricePerDay: number;        // giá mặc định cho model
  pricePerHour?: number;      // tùy chọn nếu hỗ trợ thuê theo giờ
  pricePerWeek?: number;      // ✅ mới: giá theo tuần
  pricePerMonth?: number;     // ✅ mới: giá theo tháng

  imageUrl?: string;          // ảnh minh họa
  available: boolean;         // model này có còn dùng không

  createdAt?: Timestamp | FieldValue;
  updatedAt?: Timestamp | FieldValue;
}
