import { Timestamp } from 'firebase/firestore';

export interface AccessoryExport {
  id: string;
  accessoryName: string;       // Tên phụ kiện
  accessoryId?: string;        // Nếu có id cố định (với phụ kiện dùng code)
  quantity: number;            // Số lượng xuất
  exportedBy: string;          // userId người xuất
  exportedAt: Timestamp;       // thời điểm xuất
  note?: string;               // Ghi chú lý do xuất
  target?: string;             // Xuất cho ai (xe nào, trạm nào, kỹ thuật viên...)
  companyId: string;

  // ✅ Giá tại thời điểm xuất (snapshot)
  importPrice?: number;        // Giá nhập
  retailPrice?: number;        // Giá bán đề xuất
}
