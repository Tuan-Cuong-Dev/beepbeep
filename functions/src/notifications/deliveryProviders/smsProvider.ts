/**
 * SMS Provider
 * - Nhánh 1: Twilio (REST API)
 * - Nhánh 2: VN Provider (ví dụ Viettel Brandname) -> thay endpoint/headers theo tài liệu của họ
 *
 * ENV (Twilio):
 *  - TWILIO_ACCOUNT_SID
 *  - TWILIO_AUTH_TOKEN
 *  - TWILIO_FROM                      // hoặc:
 *  - TWILIO_MESSAGING_SERVICE_SID     // khuyến nghị dùng Messaging Service
 *
 * ENV (VN Provider - ví dụ):
 *  - VN_SMS_ENDPOINT
 *  - VN_SMS_TOKEN
 */
// Date 27/09
import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface SmsTarget { to: string }

const E164 = /^\+[1-9]\d{1,14}$/;

function normalizeToE164(phoneRaw: string, defaultCountry: 'VN' | 'INTL' = 'VN'): string | undefined {
  if (!phoneRaw) return undefined;
  const digits = phoneRaw.replace(/[^\d+]/g, '');
  if (E164.test(digits)) return digits;

  if (defaultCountry === 'VN') {
    // Các dạng phổ biến: 0xxxxxxxxx, 84xxxxxxxxx, +84xxxxxxxxx
    const only = digits.replace(/\D/g, '');
    if (only.startsWith('0') && only.length === 10) return `+84${only.slice(1)}`;
    if (only.startsWith('84') && only.length === 11) return `+${only}`;
  }
  return undefined; // không chắc chắn → để caller quyết định skipped/failed
}

function parseRetryAfter(h?: string | null): number | undefined {
  if (!h) return undefined;
  if (/^\d+$/.test(h)) return Math.max(0, parseInt(h, 10));
  const t = Date.parse(h);
  if (Number.isFinite(t)) {
    const s = Math.round((t - Date.now()) / 1000);
    return s > 0 ? s : 0;
  }
  return undefined;
}

export async function sendSms(
  target: SmsTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  // 0) Chuẩn hoá số
  const toE164 = normalizeToE164(target?.to || '');
  if (!toE164) {
    return { provider: 'sms', status: 'skipped', errorCode: 'INVALID_NUMBER', errorMessage: 'Phone must be E.164 (auto-normalized for VN only)' };
  }

  // --- Nhánh Twilio ---
  const SID  = process.env.TWILIO_ACCOUNT_SID || '';
  const KEY  = process.env.TWILIO_AUTH_TOKEN  || '';
  const FROM = process.env.TWILIO_FROM || '';
  const MSGS = process.env.TWILIO_MESSAGING_SERVICE_SID || '';

  if (SID && KEY && (FROM || MSGS)) {
    try {
      const text = [payload.title?.trim(), payload.body?.trim(), payload.actionUrl?.trim()]
        .filter(Boolean).join('\n\n');

      const params = new URLSearchParams();
      params.set('To', toE164);
      if (MSGS) params.set('MessagingServiceSid', MSGS);
      else params.set('From', FROM);
      params.set('Body', text || '');

      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 10_000);

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${SID}:${KEY}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
        signal: ctrl.signal,
      }).catch((e) => { throw { code: 'FETCH_ERR', message: String(e) }; });

      clearTimeout(timeout);

      const json = (await res.json().catch(() => ({}))) as Partial<{
        sid: string;
        status: string;
        error_code: string | number | null;
        message: string;
      }>;

      if (!res.ok) {
        const retryAfterSec = parseRetryAfter(res.headers.get('retry-after'));
        const statusFamily = Math.floor(res.status / 100);
        const retryable = res.status === 429 || statusFamily === 5;

        return {
          provider: 'sms',
          status: 'failed',
          errorCode: (json.error_code ?? res.status)?.toString(),
          errorMessage: json.message || `Twilio HTTP ${res.status}`,
          meta: { ...json, retryAfterSec, retryable },
        };
      }

      return { provider: 'sms', status: 'sent', providerMessageId: json.sid, meta: json as Record<string, any> };
    } catch (e: any) {
      return { provider: 'sms', status: 'failed', errorCode: e?.code, errorMessage: e?.message || String(e) };
    }
  }

  // --- Nhánh VN Provider (ví dụ) ---
  const VN_ENDPOINT = process.env.VN_SMS_ENDPOINT || '';
  const VN_TOKEN    = process.env.VN_SMS_TOKEN || '';

  if (VN_ENDPOINT && VN_TOKEN) {
    try {
      const text = [payload.title?.trim(), payload.body?.trim(), payload.actionUrl?.trim()]
        .filter(Boolean).join('\n\n');

      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 10_000);

      const res = await fetch(VN_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VN_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: toE164, content: text, jobId: ctx.jobId }),
        signal: ctrl.signal,
      }).catch((e) => { throw { code: 'FETCH_ERR', message: String(e) }; });

      clearTimeout(timeout);

      const json = (await res.json().catch(() => ({}))) as Partial<{
        code: number | string;
        message: string;
        messageId: string;
        data: any;
      }>;

      const codeNum = json.code != null ? Number(json.code) : 0;
      if (!res.ok || codeNum !== 0) {
        const retryAfterSec = parseRetryAfter(res.headers.get('retry-after'));
        const statusFamily = Math.floor(res.status / 100);
        const retryable = res.status === 429 || statusFamily === 5;

        return {
          provider: 'sms',
          status: 'failed',
          errorCode: (json.code ?? res.status)?.toString(),
          errorMessage: json.message || `VN SMS HTTP ${res.status}`,
          meta: { ...json, retryAfterSec, retryable },
        };
      }

      return {
        provider: 'sms',
        status: 'sent',
        providerMessageId: (json.messageId || (json.data as any)?.messageId) as string | undefined,
        meta: json as Record<string, any>,
      };
    } catch (e: any) {
      return { provider: 'sms', status: 'failed', errorCode: e?.code, errorMessage: e?.message || String(e) };
    }
  }

  // Không đủ ENV
  return {
    provider: 'sms',
    status: 'skipped',
    errorCode: 'NO_PROVIDER',
    errorMessage: 'No SMS provider configured',
    meta: {
      hasTwilio: !!(SID && KEY && (FROM || MSGS)),
      hasVnProvider: !!(VN_ENDPOINT && VN_TOKEN),
    },
  };
}
