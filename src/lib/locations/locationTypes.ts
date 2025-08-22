// 📁 lib/common/locationTypes.ts
// 1) Định nghĩa LocationCore dùng chung

// geo: bắt buộc, kiểu Firestore GeoPoint → dùng cho query theo bán kính.
// location: tùy chọn, string "lat,lng" → tiện hiển thị, export/import.
// mapAddress: tùy chọn, địa chỉ mô tả (Google Maps link hoặc plain text).

import { GeoPoint, Timestamp,FieldValue } from 'firebase/firestore';

export interface LocationCore {
  geo: GeoPoint;                 // 🔴 CHUẨN DUY NHẤT để truy vấn
  location?: string;             // "16.047079,108.206230" (tùy chọn)
  mapAddress?: string;           // địa chỉ mô tả/link (tùy chọn)
  address?: string;             // địa chỉ dạng string là địa chỉ cụ thể 
  updatedAt?: Timestamp| FieldValue; // 👈 nới type để nhận serverTimestamp();         // cập nhật lần cuối (tùy chọn)
}
