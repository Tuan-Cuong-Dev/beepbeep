// src/lib/agents/referralTypes.ts
import { Timestamp } from 'firebase/firestore';

/** Trạng thái lead */
export type ReferralStatus = 'new' | 'contacted' | 'converted' | 'rejected';

/** Kênh liên lạc của khách */
export type ContactChannel =
  | 'Zalo' | 'WhatsApp' | 'Call' | 'WeChat' | 'KakaoTalk'
  | 'Facebook' | 'Instagram' | 'Other';

/** Ngôn ngữ ưu tiên */
export type PreferredLanguage = 'vi' | 'en' | 'ko' | 'ja' | 'zh';

/** Loại phương tiện khách quan tâm */
export type VehicleType = 'bike' | 'motorbike' | 'car' | 'van' | 'bus' | 'other';

/** Preset chia hoa hồng khi có đồng đội */
export type SplitPreset = '50_50' | '70_30' | '100_0' | 'custom';

/** Đồng đội cùng giới thiệu (tuỳ chọn)
 *  Lưu ý: KHÔNG ghi `undefined` vào Firestore. Nếu không có số điện thoại, hãy để `null`.
 */
export interface ReferralTeammate {
  name: string;               // tên người hỗ trợ (bảo vệ/lễ tân/buồng phòng,…)
  phone?: string | null;      // có thể null nếu không cung cấp
}

/** Thông tin meta để truy vết/analytics (tuỳ mở rộng) */
export interface AgentReferralMeta {
  byAgentId?: string | null;          // uid agent tạo/ref
  preferredLanguage?: PreferredLanguage;
  sourceTag?: string;                 // HotelLobby/Showroom/Event/Concierge/Online/...
}

/** Hồ sơ giới thiệu (bản ghi chính trong Firestore) */
export interface AgentReferral {
  id: string;
  agentId: string;                    // uid của Agent (người giới thiệu)

  // Liên kết đơn vị (quick form không bắt buộc)
  companyId?: string;
  stationId?: string;

  // Thông tin khách
  fullName: string;
  phone: string;
  note?: string;

  // Thông tin bổ sung (tuỳ chọn)
  expectedStart?: Timestamp | null;   // ngày dự kiến thuê
  rentalDays?: number;                // số ngày dự kiến (mặc định 1)
  quantity?: number;                  // số lượng xe (mặc định 1)
  vehicleType?: VehicleType;          // mặc định 'motorbike'
  modelHint?: string;
  contactChannel?: ContactChannel;
  preferredLanguage?: PreferredLanguage; // duplicate để query nhanh
  programId?: string | null;
  sourceTag?: string;                 // duplicate meta.sourceTag để filter nhanh
  consentContact?: boolean;           // đồng ý liên hệ

  // Chia hoa hồng với đồng đội (tuỳ chọn)
  teammate?: ReferralTeammate;
  splitPreset?: SplitPreset;          // 50_50 | 70_30 | 100_0 | custom
  splitSelfPct?: number;              // % phần bạn nhận (0..100), preset suy ra tự động

  // Khoá attribution (nếu sử dụng)
  attributionLocked?: boolean;

  // Trạng thái & quy chiếu
  status: ReferralStatus;
  source?: 'agent_form' | 'agent_link';
  bookingId?: string;                 // id booking khi convert

  // Hoa hồng (tổng hợp)
  commissionAmount?: number;          // tổng hoa hồng (VND) cho lead này

  // Theo dõi thời gian
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Meta mở rộng
  meta?: AgentReferralMeta;
}

/** Payload khi tạo mới từ client (khớp HotelQuickReferralPage) */
export interface AgentReferralCreateInput {
  agentId: string;                   
  fullName: string;
  phone: string;

  // tuỳ chọn đơn giản
  note?: string;
  expectedStart?: Timestamp | null;
  rentalDays?: number;
  quantity?: number;
  vehicleType?: VehicleType;
  modelHint?: string;

  // các trường mở rộng (nếu có)
  contactChannel?: ContactChannel;
  preferredLanguage?: PreferredLanguage;
  programId?: string | null;
  sourceTag?: string;
  consentContact?: boolean;

  // đồng đội (nếu có)
  teammate?: ReferralTeammate;
  splitPreset?: SplitPreset;
  splitSelfPct?: number;

  // liên kết đơn vị (nếu dùng ở luồng khác)
  companyId?: string;
  stationId?: string;

  // server có thể set mặc định: status='new', source='agent_form'
  status?: ReferralStatus;
  source?: 'agent_form' | 'agent_link';

  // meta mở rộng
  meta?: AgentReferralMeta;

  // thời gian có thể để serverTimestamp() phía server
  createdAt?: Timestamp;
  updatedAt?: Timestamp;

  // khoá attribution (nếu cần)
  attributionLocked?: boolean;
}

/** Payload khi cập nhật (partial) */
export type AgentReferralUpdateInput = Partial<
  Omit<AgentReferral, 'id' | 'agentId' | 'createdAt' | 'updatedAt'>
> & {
  updatedAt?: Timestamp;
};

/** (Tuỳ chọn) Sổ chi tiết hoa hồng cho lead — nếu muốn lưu lịch sử từng lần trả/điều chỉnh */
export interface AgentCommissionEntry {
  id: string;                         // subdoc id (referrals/{rid}/commissions/{id})
  referralId: string;
  agentId: string;
  amount: number;                     // VND (+/-)
  reason?: string;                    // "booking #1234", "điều chỉnh", ...
  createdAt: Timestamp;
}

/** (Tuỳ chọn) Tổng hợp hoa hồng theo referral để tránh tính lại */
export interface AgentReferralCommissionSummary {
  referralId: string;
  totalAmount: number;                // sum(amount)
  updatedAt: Timestamp;
}
