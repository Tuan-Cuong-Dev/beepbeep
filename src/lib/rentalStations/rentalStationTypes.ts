// lib/rentalStations/rentalStationTypes.ts
// date : 15/09/2025

import { Timestamp, GeoPoint } from 'firebase/firestore';

/** Trạng thái hoạt động của trạm */
export type StationStatus = 'active' | 'inactive';

/** Loại phương tiện hỗ trợ */
export type VehicleType = 'bike' | 'motorbike' | 'car';

/**
 * Dữ liệu trạm cho thuê (đã lưu trong Firestore)
 * - Ưu tiên dùng `geo` (GeoPoint) cho map/filter
 * - `location` giữ chuỗi tọa độ để hiển thị/SEO
 */
export interface RentalStation {
  id: string;
  companyId: string;           // 🔗 liên kết với RentalCompany
  name: string;                // Tên trạm

  // Địa chỉ
  displayAddress: string;      // Địa chỉ hiển thị cho người dùng
  mapAddress: string;          // Địa chỉ chuẩn hóa (Google Maps)

  // Tọa độ
  location: string;            // Tọa độ dạng text: '16.0226° N, 108.1207° E'
  geo?: GeoPoint;              // ✅ Tọa độ chuẩn Firestore (ưu tiên dùng cho truy vấn)

  // Thông tin vận hành
  contactPhone?: string;
  vehicleType?: VehicleType;   // ✅ Loại phương tiện hỗ trợ
  status?: StationStatus;      // ✅ 'active' | 'inactive' (mặc định 'active' khi tạo)

  // Metadata
  createdBy?: string;          // ✅ ai đã tạo
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Giá trị form tạo/sửa trạm (client-side)
 * - Không có id/companyId/timestamps
 * - Cho phép nhập tọa độ dạng chuỗi; `geo` sẽ được build ở server/service
 */
export interface RentalStationFormValues {
  name: string;

  // Địa chỉ
  displayAddress: string;
  mapAddress: string;

  // Tọa độ người dùng nhập
  location: string;            // ví dụ: "16.07° N, 108.22° E"

  // Tùy chọn
  contactPhone?: string;
  vehicleType?: VehicleType;
  status?: StationStatus;      // nếu không truyền, service set 'active'
}

/**
 * Khi cần tạo mới để ghi Firestore (server/service)
 * - Thường sẽ thêm companyId, createdBy, createdAt, v.v.
 */
export type NewRentalStation = Omit<RentalStation, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
};
