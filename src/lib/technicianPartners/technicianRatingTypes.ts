import { Timestamp } from 'firebase/firestore';

export interface TechnicianRating {
  id: string;
  technicianId: string;
  customerId: string;
  issueId?: string; // hoặc jobId nếu bạn có hệ thống job riêng
  rating: number; // 1–5
  comment?: string;
  createdAt: Timestamp;
}
