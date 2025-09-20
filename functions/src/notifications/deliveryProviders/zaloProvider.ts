/**
 * Zalo Official Account API (gửi text/button)
 * Tài liệu: https://developers.zalo.me/
 *
 * ENV cần có:
 * - ZALO_OA_ACCESS_TOKEN  (rotate qua Secret Manager)
 *
 * Lưu ý: Zalo yêu cầu user đã follow OA và bạn có user id map (zaloUserId).
 */
import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface ZaloTarget { zaloUserId: string; phone?: string }

export async function sendZalo(
  target: ZaloTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  try {
    const res = await fetch('https://openapi.zalo.me/v3.0/oa/message', {
      method: 'POST',
      headers: {
        'access_token': process.env.ZALO_OA_TOKEN || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: { user_id: target.zaloUserId },
        message: { text: `${payload.title}\n${payload.body}${payload.actionUrl ? `\n${payload.actionUrl}` : ''}` },
        tracking_id: ctx.jobId,
      }),
    });

    const json: any = await res.json().catch(() => ({}));

    if (!res.ok || json?.error) {
      return {
        provider: 'zalo',
        status: 'failed',
        errorCode: json?.error?.code?.toString?.(),
        errorMessage: json?.error?.message || `HTTP ${res.status}`,
        meta: (json ?? {}) as Record<string, any>,
      };
    }

    return {
      provider: 'zalo',
      status: 'sent',
      providerMessageId: json?.message_id || json?.data?.message_id,
      meta: (json ?? {}) as Record<string, any>,
    };
  } catch (e: any) {
    return {
      provider: 'zalo',
      status: 'failed',
      errorCode: e?.code,
      errorMessage: e?.message || String(e),
    };
  }
}
