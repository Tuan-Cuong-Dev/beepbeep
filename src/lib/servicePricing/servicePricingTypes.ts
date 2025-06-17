// 📄 lib/servicePricing/servicePricingTypes.ts
import { Timestamp } from 'firebase/firestore';

export interface ServicePricing {
  id: string;
  companyId: string;               // ✅ Gắn với công ty nào
  title: string;                   // Tên dịch vụ (VD: “Thay má phanh”, “Vệ sinh xe điện”)
  description: string;            // Mô tả chi tiết
  features: string[];             // Danh sách điểm nổi bật (VD: ["Gồm công tháo lắp", "Vệ sinh kèm kiểm tra điện"])
  price: number;                  // Giá niêm yết
  currency: 'VND';                // Hiện chỉ hỗ trợ VND
  category?: string;              // ✅ Nhóm dịch vụ (VD: 'Sửa chữa', 'Bảo trì', 'Vệ sinh')
  durationEstimate?: string;      // ✅ Ước tính thời gian thực hiện (VD: "30 phút", "1 giờ")
  isActive?: boolean;             // ✅ Dịch vụ có đang được cung cấp hay không
  imageUrl?: string;              // Hình ảnh minh họa dịch vụ
  createdBy: string;              // ID người tạo
  createdAt: Timestamp;
  updatedAt?: Timestamp;          // ✅ Thời điểm cập nhật cuối cùng
}
