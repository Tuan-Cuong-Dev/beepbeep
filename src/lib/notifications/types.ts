// src/lib/notifications/types.ts
// File chuẩn để đồng bộ với functions ở Serverless : 
// Date 19/09/2025

/** ===========================
 *  Channels & Statuses
 *  =========================== */
export type Channel = 'inapp' | 'push' | 'email' | 'sms' | 'zalo' | 'viber';

export type JobStatus =
  | 'pending'        // mới tạo, chờ orchestrator xử lý
  | 'processing'     // orchestrator đang dispatch
  | 'done'           // tất cả kênh OK
  | 'partial'        // có kênh OK, có kênh lỗi
  | 'failed';        // toàn bộ kênh lỗi

export type DeliveryStatus =
  | 'queued'         // (tuỳ chọn) xếp hàng
  | 'sent'           // gửi tới provider
  | 'delivered'      // provider báo giao thành công
  | 'read'           // user đã đọc (webhook)
  | 'skipped'        // bỏ qua (opt-out/quiet hours…)
  | 'failed';        // lỗi

/** ===========================
 *  Shared payload & target info
 *  =========================== */
export interface SendPayload {
  title: string;
  body: string;
  actionUrl?: string;
}

export interface TargetInfo {
  email?: string;
  phone?: string;
  zaloUserId?: string;
  viberUserId?: string;
  fcmToken?: string;
}

/** ===========================
 *  1) notificationJobs
 *  =========================== */
export interface NotificationJob {
  id: string;
  uid: string;              // người nhận chính
  channels: Channel[];
  title: string;
  body: string;
  actionUrl?: string;
  topic?: string;           // 'invitation' | 'booking' ...
  target?: TargetInfo;
  templateId?: string;
  data?: Record<string, any>;
  locale?: string;          // 'vi' | 'en' ...
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: number;     // Date.now() ms
  attempts?: number;
  lastError?: string;

  status: JobStatus;
  createdAt: number;
  updatedAt: number;
}

/** ===========================
 *  2) deliveries
 *  =========================== */
export interface Delivery {
  id: string;                     // ví dụ: `${jobId}_${channel}_${key}`
  jobId: string;
  uid?: string | null;            // null nếu gửi theo topic
  channel: Channel;
  provider: Channel | 'fcm' | 'inapp';
  status: DeliveryStatus;

  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;

  attempts: number;
  createdAt: number;
  sentAt?: number | null;
  deliveredAt?: number | null;
  readAt?: number | null;
  updatedAt?: number | null;

  meta?: Record<string, any> | null;
}

/** ===========================
 *  3) user_notifications/{uid}/items
 *  =========================== */
export interface InAppNotification {
  id: string;
  uid: string;
  topic?: string;
  title: string;
  body: string;
  actionUrl?: string | null;
  read: boolean;

  sourceJobId?: string;
  createdAt: number;
  readAt?: number;
}

/** ===========================
 *  4) userNotificationPreferences/{uid}
 *  =========================== */
export interface UserNotificationPreferences {
  uid: string;

  /** Nếu kênh không có khóa hoặc khác false → coi như ON */
  channelOptIn?: Partial<Record<Channel, boolean>>;

  /** Quiet hours (24h) */
  quietHours?: {
    start?: string;  // 'HH:mm'
    end?: string;    // 'HH:mm'
  };

  tokens?: { fcm?: string[] };
  addresses?: {
    email?: string;
    phone?: string;
    zaloUserId?: string;
    viberUserId?: string;
  };

  createdAt: number;
  updatedAt: number;
}

/** ===========================
 *  Provider contracts (để client biết shape kết quả)
 *  =========================== */
export interface ProviderContext {
  jobId: string;
  uid?: string;
}
export interface ProviderResult {
  provider: string; // 'email'|'sms'|'zalo'|'viber'|'fcm'|'inapp'
  status: 'sent' | 'failed' | 'skipped';
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  meta?: Record<string, any>;
}

/** ===========================
 *  Helpers
 *  =========================== */

/** Mặc định: coi như opt-in nếu không set false */
export function isChannelEnabled(
  pref: UserNotificationPreferences | undefined,
  channel: Channel
): boolean {
  const flag = pref?.channelOptIn?.[channel];
  return flag !== false;
}

/** Quiet-hours checker (đơn giản, local time) */
export function isQuietNow(pref?: UserNotificationPreferences, now = new Date()): boolean {
  if (!pref?.quietHours?.start || !pref?.quietHours?.end) return false;
  const [sH, sM] = pref.quietHours.start.split(':').map(Number);
  const [eH, eM] = pref.quietHours.end.split(':').map(Number);
  const start = sH * 60 + (sM || 0);
  const end   = eH * 60 + (eM || 0);
  const cur   = now.getHours() * 60 + now.getMinutes();
  // qua đêm (22:00 → 07:00)
  if (end <= start) return cur >= start || cur < end;
  return cur >= start && cur < end;
}

/** Tên collection chuẩn — dùng 1 nơi cho nhất quán */
export const COLLECTIONS = {
  jobs: 'notificationJobs',
  deliveries: 'deliveries',
  userNotifications: 'user_notifications', // sub: /{uid}/items/{id}
  userNotificationPreferences: 'userNotificationPreferences',
} as const;

/** ID helper cho deliveries */
export function makeDeliveryId(jobId: string, channel: Channel, key: string) {
  return `${jobId}_${channel}_${key || 'unknown'}`;
}

/** (Tuỳ chọn) Firestore converters (Web v9) */
export const converters = {
  job: {
    toFirestore: (j: NotificationJob) => j,
    fromFirestore: (snap: any): NotificationJob => snap.data() as NotificationJob,
  },
  delivery: {
    toFirestore: (d: Delivery) => d,
    fromFirestore: (snap: any): Delivery => snap.data() as Delivery,
  },
  inapp: {
    toFirestore: (n: InAppNotification) => n,
    fromFirestore: (snap: any): InAppNotification => snap.data() as InAppNotification,
  },
  pref: {
    toFirestore: (p: UserNotificationPreferences) => p,
    fromFirestore: (snap: any): UserNotificationPreferences => snap.data() as UserNotificationPreferences,
  },
};
