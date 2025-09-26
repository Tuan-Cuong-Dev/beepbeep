/**
 * SMS Provider
 * - Nhánh 1: Twilio (REST API)
 * - Nhánh 2: Nhà mạng VN (ví dụ Viettel Brandname) -> thay endpoint/headers theo tài liệu của họ
 *
 * ENV (Twilio):
 *  - TWILIO_ACCOUNT_SID
 *  - TWILIO_AUTH_TOKEN
 *  - TWILIO_FROM
 *
 * ENV (VN Provider - ví dụ):
 *  - VN_SMS_ENDPOINT
 *  - VN_SMS_TOKEN
 */

import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface SmsTarget { to: string }

const isE164 = (phone?: string) => !!phone && /^\+[1-9]\d{1,14}$/.test(phone);

/** Ưu tiên Twilio nếu đủ ENV, fallback sang VN provider nếu đủ ENV, nếu không thì skipped */
export async function sendSms(
  target: SmsTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  if (!target?.to) {
    return { provider: 'sms', status: 'skipped', errorCode: 'MISSING_TO', errorMessage: 'Missing SMS "to"' };
  }

  // ⚠️ Có thể nới lỏng nếu bạn muốn cho định dạng nội địa
  if (!isE164(target.to)) {
    return { provider: 'sms', status: 'skipped', errorCode: 'INVALID_NUMBER', errorMessage: 'Phone must be E.164' };
  }

  // --- Nhánh Twilio ---
  const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || '';
  const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '';
  const TWILIO_FROM = process.env.TWILIO_FROM || '';

  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM) {
    try {
      // Twilio yêu cầu x-www-form-urlencoded
      const body = new URLSearchParams();
      body.set('To', target.to);
      body.set('From', TWILIO_FROM);
      const text = [payload.title?.trim(), payload.body?.trim(), payload.actionUrl?.trim()]
        .filter(Boolean)
        .join('\n\n');
      body.set('Body', text || '');

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const json = (await res.json().catch(() => ({}))) as Partial<{
        sid: string;
        status: string;
        error_code: string | number | null;
        message: string;
      }>;

      if (!res.ok) {
        return {
          provider: 'sms',
          status: 'failed',
          errorCode: (json.error_code ?? res.status)?.toString(),
          errorMessage: json.message || `Twilio HTTP ${res.status}`,
          meta: json as Record<string, any>,
        };
      }

      return {
        provider: 'sms',
        status: 'sent',
        providerMessageId: json.sid,
        meta: json as Record<string, any>,
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

  // --- Nhánh VN Provider (ví dụ, bạn sửa theo thực tế) ---
  const VN_SMS_ENDPOINT = process.env.VN_SMS_ENDPOINT || '';
  const VN_SMS_TOKEN = process.env.VN_SMS_TOKEN || '';

  if (VN_SMS_ENDPOINT && VN_SMS_TOKEN) {
    try {
      const text = [payload.title?.trim(), payload.body?.trim(), payload.actionUrl?.trim()]
        .filter(Boolean)
        .join('\n\n');

      const res = await fetch(VN_SMS_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VN_SMS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: target.to,
          content: text,
          jobId: ctx.jobId,
        }),
      });

      const json = (await res.json().catch(() => ({}))) as Partial<{
        code: number | string;
        message: string;
        messageId: string;
        data: any;
      }>;

      if (!res.ok || (json.code && Number(json.code) !== 0)) {
        return {
          provider: 'sms',
          status: 'failed',
          errorCode: (json.code ?? res.status)?.toString(),
          errorMessage: json.message || `VN SMS HTTP ${res.status}`,
          meta: json as Record<string, any>,
        };
      }

      return {
        provider: 'sms',
        status: 'sent',
        providerMessageId: (json.messageId || (json.data as any)?.messageId) as string | undefined,
        meta: json as Record<string, any>,
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

  // Không đủ ENV cho bất kỳ provider nào
  return {
    provider: 'sms',
    status: 'skipped',
    errorCode: 'NO_PROVIDER',
    errorMessage: 'No SMS provider configured',
    meta: {
      hasTwilio: !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_FROM),
      hasVnProvider: !!(VN_SMS_ENDPOINT && VN_SMS_TOKEN),
    },
  };
}
