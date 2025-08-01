import { Timestamp } from 'firebase/firestore';

export type ContributionType =
  | 'repair_shop'
  | 'rental_shop'
  | 'battery_station'
  | 'battery_charging_station' // ✅ NEW: Trạm sạc pin
  | 'map_location'
  | 'issue_proposal'; // dành cho kỹ thuật viên

export type ContributionStatus = 'pending' | 'approved' | 'rejected';

export interface Contribution {
  id?: string;
  userId: string;
  type: ContributionType;
  status: ContributionStatus;
  data: any; // lưu dữ liệu đóng góp cụ thể
  createdAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewerId?: string;
  note?: string;
  pointsAwarded?: number;
}
