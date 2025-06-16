import { Timestamp } from "firebase/firestore";

export type VehicleIssueStatus = 
  | 'pending'          // Chưa xử lý
  | 'assigned'         // Đã được giao
  | 'proposed'         // Gửi đề xuất phương án xử lý
  | 'confirmed'        // Đã duyệt → OK, bắt đầu xử lý
  | 'rejected'         // Đã từ chối → Không được thực hiện
  | 'in_progress'      // Đang xử lý
  | 'resolved'         // Đã xử lý xong
  | 'closed';          // Đã đóng (kết thúc)

export type VehicleIssueID = string;

export interface VehicleIssueCore {
  id: VehicleIssueID;
  companyId: string;
  stationId: string;
  ebikeId: string;
  issueType: string;
  description: string;
  photos: string[];
  status: VehicleIssueStatus;
  reportedBy: string;
  assignedTo?: string;
  assignedAt?: Timestamp;
  reportedAt: Timestamp;
  updatedAt: Timestamp;

  // ✅ Thông tin khi đóng sự cố
  closedAt?: Timestamp;
  closedBy?: string;

  // ✅ Mở rộng cho khách hàng lẻ
  customerName?: string;
  customerPhone?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  customerLocation?: string;
}

export type VehicleIssue = VehicleIssueCore;

export interface ExtendedVehicleIssue extends VehicleIssueCore {
  companyName?: string;
  stationName?: string;
  vin?: string;
  plateNumber?: string;
  assignedToName?: string;
  assignedTechnicianId?: string;

  // ✅ Đề xuất xử lý bởi Technician
  proposedSolution?: string;
  proposedCost?: number;

  // ✅ Duyệt hoặc từ chối bởi Admin/Company Owner
  approveStatus?: 'pending' | 'approved' | 'rejected';

  // ✅ Kết quả xử lý thực tế
  actualSolution?: string;
  actualCost?: number;

  // ✅ Hiển thị tên người đóng sự cố
  closedByName?: string;

  // ✅ Thêm trường ghi chú khi đóng sự cố
  closeComment?: string;
}
