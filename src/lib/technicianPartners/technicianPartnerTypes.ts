import { Timestamp } from 'firebase/firestore';
import { WorkingHours } from './workingHoursTypes';

export interface TechnicianPartner {
  id?: string; // Firebase sẽ tự sinh khi tạo mới
  userId?: string; // Liên kết với user (gán sau khi tạo user Firebase)
  createdBy: string; // userId của Technician Assistant tạo hồ sơ

  name: string;
  phone: string;
  email?: string;

  // Loại kỹ thuật viên: shop có cửa hàng, mobile là lưu động
  type: 'shop' | 'mobile';

  // Nếu là shop thì có thêm thông tin cửa hàng
  shopName?: string;
  shopAddress?: string;
  geo?: {
    lat: number;
    lng: number;
  };

  // Vùng tự nhận xử lý (do technician điền)
  assignedRegions: string[];

  // Vùng được gán bởi Assistant/Admin (để phân công theo vùng)
  geoBox?: {
    latMin: number;
    latMax: number;
    lngMin: number;
    lngMax: number;
  };

  // Các loại dịch vụ hỗ trợ (sửa pin, phanh, lốp, v.v.)
  serviceCategories?: string[];

  // Thời gian làm việc trong tuần
  workingHours: WorkingHours[];

  // Đánh giá từ khách hàng hoặc hệ thống
  averageRating?: number;
  ratingCount?: number;

  isActive: boolean; // Kích hoạt hay không
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
