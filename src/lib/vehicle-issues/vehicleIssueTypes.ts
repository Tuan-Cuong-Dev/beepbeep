import { Timestamp } from 'firebase/firestore';

/** Trạng thái xử lý sự cố */
export type VehicleIssueStatus =
  | 'pending'       // Chưa xử lý
  | 'assigned'      // Đã giao technician
  | 'proposed'      // Technician gửi đề xuất
  | 'confirmed'     // Quản lý duyệt đề xuất
  | 'rejected'      // Quản lý từ chối đề xuất
  | 'in_progress'   // Đang xử lý
  | 'resolved'      // Đã xử lý xong
  | 'closed';       // Đã đóng

export type VehicleIssueID = string;

/** Trường bắt buộc/chuẩn dùng chung */
export interface VehicleIssueCore {
  id: VehicleIssueID;

  // Liên kết hệ thống
  companyId: string;
  stationId: string;
  ebikeId: string;

  // Nội dung sự cố
  issueType: string;
  description: string;
  photos: string[];
  status: VehicleIssueStatus;

  // Báo cáo & phân công
  reportedBy: string;         // uid người báo cáo
  reportedAt: Timestamp;
  updatedAt: Timestamp;
  assignedTo?: string;        // uid technician được giao
  assignedAt?: Timestamp;

  // Đóng sự cố
  closedAt?: Timestamp;
  closedBy?: string;          // uid người đóng

  // Khách hàng lẻ (ngoài hệ thống)
  customerName?: string;
  customerPhone?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleLicensePlate?: string;
  customerLocation?: string;
}

/** Alias đơn giản nếu cần dùng */
export type VehicleIssue = VehicleIssueCore;

/** Mở rộng cho hiển thị & quy trình duyệt/ghi chú */
export interface ExtendedVehicleIssue extends VehicleIssueCore {
  // Tên hiển thị
  companyName?: string;
  stationName?: string;
  vin?: string;
  plateNumber?: string;
  assignedToName?: string;
  assignedTechnicianId?: string; // nếu bạn cần id khác với uid

  // Đề xuất của technician
  proposedSolution?: string;
  proposedCost?: number;

  // Duyệt/từ chối (audit)
  approvedAt?: Timestamp;
  approvedBy?: string;     // uid người duyệt
  rejectedAt?: Timestamp;
  rejectedBy?: string;     // uid người từ chối

  // Lý do/ghi chú trạng thái (dùng khi reject, hoặc các ghi chú khác)
  statusComment?: string;

  // Kết quả thực tế
  actualSolution?: string;
  actualCost?: number;

  // Hiển thị khi đóng sự cố
  closedByName?: string;
  closeComment?: string;
}
