// Cấu hình linh hoạt theo % hoặc theo số tiền, áp dụng cho 2 đối tượng: CTV (agent) và Đại lý (dealer).
//  Phần giảm giá cho khách hàng cuối bỏ qua (không liên quan đến commission).
//  Types: mở rộng Program cho commission theo model

import { Timestamp } from 'firebase/firestore';

/** Loại chương trình */
export type ProgramType = 'agent_program' | 'rental_program';

/** Hình thức giảm giá (áp cho khách thuê – giữ nguyên) */
export type DiscountType = 'fixed' | 'percentage';

/** Đối tượng hưởng commission */
export type CommissionAudience = 'agent' | 'dealer';

/** Chính sách commission cho từng đối tượng */
export type CommissionPolicy =
  | { mode: 'percent'; rate: number; min?: number; max?: number } // rate: 0..1 (ví dụ 0.1 = 10%)
  | { mode: 'flat'; amount: number };                             // số tiền (VND) trên booking

/** Trạng thái người tham gia */
export type ProgramParticipantStatus = 'joined' | 'pending' | 'rejected';

/** Trạng thái chương trình */
export type ProgramStatus =
  | 'scheduled'
  | 'active'
  | 'ended'
  | 'paused'
  | 'archived'
  | 'canceled';

/** Giảm giá theo model (áp cho KH thuê) – giữ nguyên */
export interface ProgramModelDiscount {
  modelId: string;
  discountType: DiscountType;
  discountValue: number; // fixed: VND/ngày; percentage: 0..100 (%)
}

/** Hoa hồng theo model và đối tượng (CTV/Đại lý) */
export interface ProgramModelCommission {
  modelId: string;
  /** Commission cho CTV (agent) – optional */
  agent?: CommissionPolicy;
  /** Commission cho Đại lý (dealer) – optional */
  dealer?: CommissionPolicy;
}

export interface ProgramStationTarget {
  stationId: string;
}

export interface Program {
  id: string;

  title: string;
  description: string;
  type: ProgramType;

  createdByUserId: string;
  createdByRole: 'Admin' | 'company_owner' | 'private_provider';

  companyId?: string | null;

  /** Target áp dụng (rental_program có thể target theo trạm) */
  stationTargets?: ProgramStationTarget[];

  /** Giảm giá cho khách thuê (rental_program) */
  modelDiscounts?: ProgramModelDiscount[];

  /** Commission cấu hình cho CTV/Đại lý (áp dụng theo model) */
  modelCommissions?: ProgramModelCommission[];

  /** Cho phép null để tránh lỗi toMillis */
  startDate?: Timestamp | null;
  endDate?: Timestamp | null;

  /** Cờ tương thích cũ */
  isActive: boolean;

  /** Trạng thái hiển thị đã chuẩn hoá */
  status: ProgramStatus;

  /** Counters/extra (optional) */
  participantsCount?: number;
  ordersCount?: number;

  /** Dấu mốc vòng đời */
  createdAt: Timestamp;
  updatedAt: Timestamp;
  endedAt?: Timestamp | null;
  archivedAt?: Timestamp | null;
  canceledAt?: Timestamp | null;
}

export interface ProgramParticipant {
  id: string;
  programId: string;
  userId: string;
  userRole: 'agent' | 'customer' | 'staff';
  status: ProgramParticipantStatus;
  joinedAt: Timestamp;
}
