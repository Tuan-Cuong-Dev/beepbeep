// functions/src/notifications/deliveryProviders/types.ts

export type Channel = 'inapp' | 'push' | 'email' | 'sms' | 'zalo' | 'viber';

export type JobStatus = 'pending' | 'processing' | 'done' | 'partial' | 'failed';
export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'skipped' | 'failed';

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

export interface NotificationJob {
  id: string;
  uid: string;
  channels: Channel[];
  title: string;
  body: string;
  actionUrl?: string;
  topic?: string;
  target?: TargetInfo;
  templateId?: string;
  data?: Record<string, any>;
  locale?: string;
  priority?: 'low' | 'normal' | 'high';
  scheduledAt?: number;
  attempts?: number;
  lastError?: string;
  status: JobStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Delivery {
  id: string;
  jobId: string;
  uid?: string | null;
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

export interface UserNotificationPreferences {
  uid: string;
  channelOptIn?: Partial<Record<Channel, boolean>>;
  quietHours?: { start?: string; end?: string };
  tokens?: { fcm?: string[] };
  addresses?: { email?: string; phone?: string; zaloUserId?: string; viberUserId?: string };
  createdAt: number;
  updatedAt: number;
}

export interface ProviderContext {
  jobId: string;
  uid?: string;
}
export interface ProviderResult {
  provider: string;
  status: 'sent' | 'failed' | 'skipped';
  providerMessageId?: string | null;
  errorCode?: string | null;
  errorMessage?: string | null;
  meta?: Record<string, any>;
}

export const COLLECTIONS = {
  jobs: 'notificationJobs',
  deliveries: 'deliveries',
  userNotifications: 'user_notifications',
  userNotificationPreferences: 'userNotificationPreferences',
} as const;

export function makeDeliveryId(jobId: string, channel: Channel, key: string) {
  return `${jobId}_${channel}_${key || 'unknown'}`;
}
