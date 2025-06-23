import { Timestamp } from 'firebase/firestore';
import { WorkingHours } from './workingHoursTypes';

export interface TechnicianPartner {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string;

  // Phân loại: Có cửa hàng hay di động
  type: 'shop' | 'mobile';

  // Nếu có cửa hàng
  shopName?: string;
  shopAddress?: string;
  geo?: {
    lat: number;
    lng: number;
  };

  // Vùng do technician chọn (text)
  assignedRegions: string[]; // VD: ['DaNang/ThanhKhe/ThanhKheTay']

  // Vùng do assistant/admin gán (geoBox)
  geoBox?: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };

  // Dịch vụ họ nhận xử lý
  serviceCategories?: string[]; // VD: ['battery', 'brake', 'flat_tire']

  // Thời gian làm việc trong tuần
  workingHours: WorkingHours[];

  // Đánh giá
  averageRating?: number;
  ratingCount?: number;

  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
