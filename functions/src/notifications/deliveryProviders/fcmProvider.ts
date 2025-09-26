// functions/src/notifications/deliveryProviders/fcmProvider.ts
import admin from 'firebase-admin';
import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface FcmTarget {
  tokens?: string[]; // multicast
  token?: string;    // single
  topic?: string;    // optional
}

export async function sendFcm(
  target: FcmTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  try {
    const baseData = {
      actionUrl: payload.actionUrl ?? '',
      jobId: String(ctx.jobId ?? ''),
      uid: String(ctx.uid ?? ''),
    };

    const baseAndroid: admin.messaging.AndroidConfig = {
      priority: 'high',
      notification: { sound: 'default' },
    };

    const baseApns: admin.messaging.ApnsConfig = {
      payload: {
        aps: {
          sound: 'default',
          'thread-id': String(ctx.jobId ?? ''),
        },
      },
    };

    // (Optional) Hỗ trợ Web Push
    const baseWebpush: admin.messaging.WebpushConfig = {
      fcmOptions: payload.actionUrl ? { link: payload.actionUrl } : undefined,
      notification: {
        // icon: '/icons/icon-192x192.png', // nếu có
        vibrate: [100, 50, 100],
        requireInteraction: true,
      },
    };

    // 1) Multicast
    const tokens = (target.tokens || []).filter(Boolean) as string[];
    if (tokens.length > 0) {
      const multi: admin.messaging.MulticastMessage = {
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: baseData,
        android: baseAndroid,
        apns: baseApns,
        webpush: baseWebpush,
      };

      const res = await admin.messaging().sendEachForMulticast(multi);
      const okCount = res.responses.filter(r => r.success).length;
      const firstOk = res.responses.find(r => r.success)?.messageId;
      const firstErr = res.responses.find(r => !r.success)?.error;

      return {
        provider: 'fcm',
        status: okCount > 0 ? 'sent' : 'failed',
        providerMessageId: firstOk,
        errorCode: firstErr?.code,
        errorMessage: firstErr?.message,
        meta: { successCount: okCount, failureCount: res.failureCount },
      };
    }

    // 2) Topic
    if (target.topic) {
      const msg: admin.messaging.Message = {
        topic: target.topic,
        notification: { title: payload.title, body: payload.body },
        data: baseData,
        android: baseAndroid,
        apns: baseApns,
        webpush: baseWebpush,
      };

      const id = await admin.messaging().send(msg);
      return { provider: 'fcm', status: 'sent', providerMessageId: id };
    }

    // 3) Single token
    if (target.token) {
      const msg: admin.messaging.Message = {
        token: target.token,
        notification: { title: payload.title, body: payload.body },
        data: baseData,
        android: baseAndroid,
        apns: baseApns,
        webpush: baseWebpush,
      };

      const id = await admin.messaging().send(msg);
      return { provider: 'fcm', status: 'sent', providerMessageId: id };
    }

    // 4) Không có target hợp lệ
    return {
      provider: 'fcm',
      status: 'skipped',
      errorMessage: 'No FCM target (tokens/topic/token) provided',
    };
  } catch (e: any) {
    return {
      provider: 'fcm',
      status: 'failed',
      errorCode: e?.code,
      errorMessage: e?.message || String(e),
    };
  }
}
