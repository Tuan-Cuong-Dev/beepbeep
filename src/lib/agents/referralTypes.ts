// Agent - Giới thiệu khách hàng 

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

/** Thông tin meta để truy vết/analytics */
export interface AgentReferralMeta {
  byAgentId?: string | null;        // uid agent tạo/ref
  preferredLanguage?: PreferredLanguage;
  sourceTag?: string;               // HotelLobby/Showroom/Event/Concierge/Online/...
}

/** Hồ sơ giới thiệu (bản ghi chính trong Firestore) */
export interface AgentReferral {
  id: string;
  agentId: string;                  // uid của Agent (người giới thiệu)

  // Liên kết đơn vị
  companyId?: string;               // công ty dự định book
  stationId?: string;               // trạm dự định book

  // Thông tin khách
  fullName: string;
  phone: string;
  note?: string;

  // Thông tin bổ sung (tùy chọn)
  expectedStart?: Timestamp | null; // ngày dự kiến thuê
  vehicleType?: VehicleType;
  modelHint?: string;
  contactChannel?: ContactChannel;
  preferredLanguage?: PreferredLanguage; // duplicate với meta.preferredLanguage để truy vấn nhanh (tùy bạn)
  programId?: string | null;        // chương trình mà Agent muốn áp
  sourceTag?: string;               // duplicate với meta.sourceTag nếu cần filter nhanh
  consentContact?: boolean;         // đã đồng ý liên hệ

  // Trạng thái & quy chiếu
  status: ReferralStatus;
  source?: 'agent_form' | 'agent_link'; // cách tạo lead
  bookingId?: string;               // id booking khi convert

  // Hoa hồng (tổng hợp)
  commissionAmount?: number;        // tổng hoa hồng (VND) cho lead này (nếu đã kết sổ)

  // Theo dõi thời gian
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Meta mở rộng
  meta?: AgentReferralMeta;
}

/** Payload khi tạo mới từ client (khớp với onSubmit hiện tại) */
export interface AgentReferralCreateInput {
  agentId: string;                  // có thể gán trong cloud, nhưng để rõ ràng
  fullName: string;
  phone: string;

  // tùy chọn
  note?: string;
  companyId?: string;
  stationId?: string;
  expectedStart?: Timestamp | null;
  vehicleType?: VehicleType;
  modelHint?: string;
  contactChannel?: ContactChannel;
  preferredLanguage?: PreferredLanguage;
  programId?: string | null;
  sourceTag?: string;
  consentContact?: boolean;

  // server có thể set mặc định: status='new', source='agent_form'
  status?: ReferralStatus;
  source?: 'agent_form' | 'agent_link';

  // meta mở rộng
  meta?: AgentReferralMeta;

  // thời gian có thể để serverTimestamp() phía server
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/** Payload khi cập nhật (partial) */
export type AgentReferralUpdateInput = Partial<
  Omit<AgentReferral,
    'id' | 'agentId' | 'createdAt' | 'updatedAt'
  >
> & {
  updatedAt?: Timestamp;
};

/** (Tùy chọn) Sổ chi tiết hoa hồng cho lead — nếu bạn muốn lưu lịch sử từng lần trả/điều chỉnh */
export interface AgentCommissionEntry {
  id: string;                       // subdoc id (referrals/{rid}/commissions/{id})
  referralId: string;
  agentId: string;
  amount: number;                   // VND (+/-)
  reason?: string;                  // ví dụ: "booking #1234", "điều chỉnh", ...
  createdAt: Timestamp;
}

/** (Tùy chọn) Tổng hợp hoa hồng theo referral để tránh tính lại */
export interface AgentReferralCommissionSummary {
  referralId: string;
  totalAmount: number;              // sum(amount)
  updatedAt: Timestamp;
}
