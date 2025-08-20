// 📁 lib/publicIssue/publicIssueTypes.ts
import { Timestamp } from 'firebase/firestore';

export type PublicIssueStatus =
  | 'pending'          // Chưa xử lý
  | 'assigned'         // Đã được giao
  | 'proposed'         // Gửi đề xuất phương án xử lý
  | 'confirmed'        // Đã duyệt → OK, bắt đầu xử lý
  | 'rejected'         // Đã từ chối → Không được thực hiện
  | 'in_progress'      // Đang xử lý
  | 'resolved'         // Đã xử lý xong
  | 'closed';          // Đã đóng (kết thúc)

export type PublicIssueID = string;

export interface PublicVehicleIssue {
  id?: PublicIssueID;
  customerName: string;
  phone: string;
  issueDescription: string;
  vehicleId?: string;
  reportedBy?: string;
  status: PublicIssueStatus;
  assignedTo?: string;
  // ⬇️ thêm dòng này
  assignedToName?: string; // hiển thị tên kỹ thuật viên để dễ hiển thị trên table lỗi

  assignedBy?: string;
  assignedAt?: Timestamp; 
  createdAt: Timestamp;
  updatedAt?: Timestamp;

  // 🔍 Mở rộng dữ liệu khách hàng
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;

  // 🗺️ Thông tin vị trí gặp sự cố
  location: {
    mapAddress: string;
    coordinates?: string;
    issueAddress?: string;
  };

  // ✅ Thông tin khi đóng sự cố
  closedAt?: Timestamp;
  closedBy?: string;
  closedByName?: string;
  closeComment?: string;

  // ✅ Đề xuất xử lý bởi Technician_Partner
  proposedSolution?: string;
  proposedCost?: number;

  // ✅ Duyệt hoặc từ chối bởi Techinician_assistant
  approveStatus?: 'pending' | 'approved' | 'rejected';

  // ✅ Kết quả xử lý thực tế bởi Techinician_partner
  actualSolution?: string;
  actualCost?: number;
}
