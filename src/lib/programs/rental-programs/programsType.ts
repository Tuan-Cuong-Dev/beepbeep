import { Timestamp } from 'firebase/firestore';

/**
 * Loại chương trình (Program Type)
 */
export type ProgramType = 'agent_program' | 'rental_program';

/**
 * Hình thức giảm giá áp dụng cho model
 */
export type DiscountType = 'fixed' | 'percentage';

/**
 * Trạng thái của người tham gia chương trình
 */
export type ProgramParticipantStatus = 'joined' | 'pending' | 'rejected';

/**
 * Đối tượng áp dụng giảm giá theo từng model
 */
export interface ProgramModelDiscount {
  modelId: string;
  discountType: DiscountType;   // fixed (giá cố định) hoặc percentage (%)
  discountValue: number;        // số tiền giảm hoặc %
}

/**
 * Đối tượng áp dụng theo trạm
 */
export interface ProgramStationTarget {
  stationId: string;
}

/**
 * Chương trình ưu đãi / khuyến mãi
 */
export interface Program {
  id: string;

  // Tiêu đề chương trình
  title: string;

  // Mô tả chương trình
  description: string;

  // Loại chương trình (agent_program hoặc rental_program)
  type: ProgramType;

  // Người tạo chương trình
  createdByUserId: string;
  createdByRole: 'Admin' | 'company_owner' | 'private_provider';

  // Công ty áp dụng (chỉ có khi là rental_program)
  companyId?: string | null;

  // Danh sách trạm áp dụng (nếu có)
  stationTargets?: ProgramStationTarget[];

  // Danh sách model và giá giảm
  modelDiscounts?: ProgramModelDiscount[];

  // Thời gian áp dụng chương trình
  startDate?: Timestamp;
  endDate?: Timestamp;

  // Trạng thái chương trình
  isActive: boolean;

  // Thời gian tạo và cập nhật
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Người tham gia chương trình
 */

export interface ProgramParticipant {
  id: string;

  // Chương trình liên quan
  programId: string;

  // Người tham gia
  userId: string;
  userRole: 'agent' | 'customer' | 'staff';

  // Trạng thái tham gia
  status: ProgramParticipantStatus;

  // Ngày tham gia
  joinedAt: Timestamp;
}
