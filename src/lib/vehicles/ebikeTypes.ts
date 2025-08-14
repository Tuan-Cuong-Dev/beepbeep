// lib/ebikes/ebikeTypes.ts 

// Thao tác chuyển rồi xóa
import { Timestamp } from "firebase/firestore";

// Enum giúp type-safe khi dùng status
export type EbikeStatus =
  | 'Available'
  | 'In Use'
  | 'Under Maintenance'
  | 'Reserved' 
  | 'Sold' // Những xe đã bán; do xe cũ ko muốn sử dụng cho thuê nữa
  | 'Broken';

export interface Ebike {
  id: string;
  modelId: string;            // 🔗 ebikeModels
  companyId: string;          // 🔗 rentalCompanies (hoặc private_provider)
  stationId: string;          // 🔗 rentalStations

  serialNumber: string;       // số series của nhà sản xuất
  vehicleID: string;          // số khung / số VIN
  plateNumber: string;        // biển số xe
  odo: number;                // số km đã chạy
  color: string;              // màu sắc
  status: EbikeStatus;        // trạng thái xe
  currentLocation: string;    // mô tả vị trí thực tế
  lastMaintained: Timestamp | null;

  batteryCapacity: string;    // Định dạng ví dụ: "72V22Ah"
  range: number;              // quãng đường dự kiến (km)

  pricePerHour?: number;      // giá thuê theo giờ (tùy chọn)
  pricePerDay: number;        // giá thuê mặc định theo ngày
  pricePerWeek?: number;      // giá thuê theo tuần (tùy chọn)
  pricePerMonth?: number;     // giá thuê theo tháng (tùy chọn)

  note?: string;              // chú thích thêm về xe (ghi chú tình trạng, đặc điểm riêng, v.v.)
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
