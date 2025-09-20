/**
 * SMS qua Twilio hoặc nhà mạng nội địa (Viettel SMS Brandname).
 * ENV:
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_FROM (số/gửi từ brandname)
 *
 * Nếu dùng provider VN: thay endpoint/headers theo tài liệu của họ.
 */
import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface SmsTarget { to: string }

export async function sendSms(
  target: SmsTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  try {
    // ... gọi API SMS của bạn ở đây, mình giả sử dùng fetch
    const res = await fetch('https://your-sms-provider.example/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: target.to,
        text: `${payload.title}\n${payload.body}${payload.actionUrl ? `\n${payload.actionUrl}` : ''}`,
        jobId: ctx.jobId,
      }),
    });

    const json: any = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        provider: 'sms',
        status: 'failed',
        errorCode: json?.code?.toString?.(),
        errorMessage: json?.message || `HTTP ${res.status}`,
        meta: (json ?? {}) as Record<string, any>,
      };
    }

    return {
      provider: 'sms',
      status: 'sent',
      providerMessageId: json?.sid,
      meta: (json ?? {}) as Record<string, any>,
    };
  } catch (e: any) {
    return {
      provider: 'sms',
      status: 'failed',
      errorCode: e?.code,
      errorMessage: e?.message || String(e),
    };
  }
}
