// lib/maintenanceLogs/maintenanceLogTypes.ts
import { Timestamp } from "firebase/firestore";

export interface MaintenanceLog {
  id: string;
  ebikeId: string;            // 🔗 xe được bảo trì
  companyId: string;          // 🔗 công ty sở hữu
  stationId?: string;         // 🔗 trạm thực hiện bảo trì (nếu có)

  performedBy: string;        // tên kỹ thuật viên hoặc userId
  description: string;        // nội dung bảo trì
  note?: string;              // ghi chú thêm

  date: Timestamp;            // thời gian thực hiện
  cost?: number;              // chi phí bảo trì nếu có

  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
