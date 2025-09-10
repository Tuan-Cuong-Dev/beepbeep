import { Timestamp } from 'firebase/firestore';

/** Loại chương trình */
export type ProgramType = 'agent_program' | 'rental_program';

/** Hình thức giảm giá */
export type DiscountType = 'fixed' | 'percentage';

/** Trạng thái người tham gia */
export type ProgramParticipantStatus = 'joined' | 'pending' | 'rejected';

/** Trạng thái chương trình (đồng bộ với server-actions) */
export type ProgramStatus =
  | 'scheduled' // chưa tới startDate
  | 'active'    // đang chạy
  | 'ended'     // đã kết thúc theo thời gian hoặc force end
  | 'paused'    // tạm dừng (isActive = false nhưng chưa archive/cancel/ended)
  | 'archived'  // lưu trữ mềm
  | 'canceled'; // huỷ trước khi chạy

export interface ProgramModelDiscount {
  modelId: string;
  discountType: DiscountType;
  discountValue: number;
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
  stationTargets?: ProgramStationTarget[];
  modelDiscounts?: ProgramModelDiscount[];

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
