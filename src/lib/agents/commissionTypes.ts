//Agent -  Giới thiệu khách hàng và lịch sử hoa hồng

import { Timestamp } from 'firebase/firestore';

export type CommissionStatus =
  | 'pending'     // vừa ghi nhận, chờ duyệt
  | 'approved'    // đã duyệt, chờ chi trả
  | 'paid'        // đã chi trả
  | 'rejected'    // từ chối (hoặc thu hồi)

export type CommissionType =
  | 'lead_bonus'
  | 'booking_confirmed'
  | 'booking_completed'
  | 'booking_cancelled'       // (mới) dùng để thu hồi/điều chỉnh âm
  | 'manual_adjustment'
  | 'payout';                 // ghi nhận chi trả

export interface CommissionTxn {
  id: string;

  // Who/Where
  agentId: string;
  companyId?: string | null;
  agentProgramId?: string | null;

  // Source links (tùy type)
  referralId?: string | null;
  bookingId?: string | null;
  payoutId?: string | null;   // nếu tách bảng payout

  // Money
  type: CommissionType;
  amount: number;             // số dương; nếu bạn muốn thu hồi, tạo txn 'booking_cancelled' với amount dương và xử lý sign ở field dưới
  currency: 'VND';

  // Optional polarity (nếu bạn thích ledger 2 chiều ngay trong 1 bảng)
  direction?: 'credit' | 'debit'; // credit = cộng cho agent, debit = trừ
  // hoặc bỏ 'direction' và mặc định:
  // - lead_bonus/booking_* => credit
  // - payout/booking_cancelled => debit

  status: CommissionStatus;
  note?: string;

  // Audit snapshot (để sau này thay đổi policy không làm lệch lịch sử)
  snapshot?: {
    policy?: {
      mode: 'percent' | 'flat';
      rate?: number;   // 0..1
      amount?: number; // VND
      min?: number;
      max?: number;
    };
    baseAmount?: number;      // số tiền gốc dùng tính commission (giá trị tại thời điểm đó)
    computedAt?: Timestamp;   // thời điểm tính
  };

  // Idempotency / chống ghi trùng (ví dụ: bookingId + phase)
  dedupeKey?: string;

  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
