// lib/staff/staffTypes.ts
import { Timestamp } from 'firebase/firestore';

export interface Staff {
  id: string;
  userId: string;
  companyId: string;
  stationId?: string;

  role: 'company_admin' | 'station_manager' | 'technician' | 'support'; // 👈 kiểu ENUM cụ thể

  name: string;
  email: string;
  phone: string;

  accepted?: boolean; // true nếu đã chấp nhận lời mời
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ExtendedStaff extends Staff {
  isPending?: boolean; // true nếu chưa accepted
}
