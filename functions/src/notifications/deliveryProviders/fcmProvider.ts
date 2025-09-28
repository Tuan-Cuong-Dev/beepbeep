// functions/src/notifications/deliveryProviders/fcmProvider.ts
// Date 27/09
import { admin } from '../../utils/db.js';
import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface FcmTarget {
  tokens?: string[]; // multicast
  token?: string;    // single
  topic?: string;    // optional
}

const MAX_MULTICAST = 500;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function isRetryable(code?: string) {
  // Các mã thường có thể retry
  return [
    'messaging/internal-error',
    'messaging/server-unavailable',
    'messaging/unknown-error',
    'messaging/quota-exceeded',
  ].includes(code ?? '');
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
      // collapseKey: String(ctx.jobId ?? ''), // bật nếu muốn gộp
    };

    const baseApns: admin.messaging.ApnsConfig = {
      payload: { aps: { sound: 'default', 'thread-id': String(ctx.jobId ?? '') } },
    };

    const baseWebpush: admin.messaging.WebpushConfig = {
      fcmOptions: payload.actionUrl ? { link: payload.actionUrl } : undefined,
      notification: { vibrate: [100, 50, 100], requireInteraction: true },
    };

    const tokens = (target.tokens || []).filter(Boolean) as string[];

    // 1) Multicast (chunk ≤ 500)
    if (tokens.length > 0) {
      let totalOk = 0;
      let totalFail = 0;
      let firstOkId: string | undefined;
      const invalidTokens: string[] = [];
      let retryable = false;

      for (const batch of chunk(tokens, MAX_MULTICAST)) {
        const multi: admin.messaging.MulticastMessage = {
          tokens: batch,
          notification: { title: payload.title, body: payload.body },
          data: baseData,
          android: baseAndroid,
          apns: baseApns,
          webpush: baseWebpush,
        };

        const res = await admin.messaging().sendEachForMulticast(multi);
        totalOk += res.successCount;
        totalFail += res.failureCount;

        for (let i = 0; i < res.responses.length; i++) {
          const r = res.responses[i];
          if (r.success) {
            if (!firstOkId) firstOkId = r.messageId;
          } else {
            const code = r.error?.code;
            if (
              code === 'messaging/registration-token-not-registered' ||
              code === 'messaging/invalid-registration-token'
            ) {
              invalidTokens.push(batch[i]);
            }
            if (isRetryable(code)) retryable = true;
          }
        }
      }

      return {
        provider: 'fcm',
        status: totalOk > 0 ? 'sent' : 'failed',
        providerMessageId: firstOkId,
        errorCode: totalOk > 0 ? undefined : 'MULTICAST_FAILED',
        errorMessage: totalOk > 0 ? undefined : 'All tokens failed',
        meta: {
          successCount: totalOk,
          failureCount: totalFail,
          invalidTokens,
          retryable,
        },
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
      return { provider: 'fcm', status: 'sent', providerMessageId: id, meta: { topic: target.topic } };
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
