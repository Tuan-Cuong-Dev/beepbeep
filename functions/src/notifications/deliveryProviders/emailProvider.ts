/**
 * Email qua SendGrid (ưu tiên) hoặc skip nếu không cấu hình.
 * ENV:
 *  - SENDGRID_API_KEY
 *  - SENDGRID_FROM             // chấp nhận "Name <email@domain>" hoặc chỉ "email@domain"
 *
 * Gợi ý orchestrator: dùng meta.retryAfterSec (nếu có) để backoff khi 429.
 */
// Date 27/09
import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface EmailTarget {
  to: string;
  cc?: string[];
  bcc?: string[];
}

export async function sendEmail(
  target: EmailTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  if (!target?.to) {
    return {
      provider: 'email',
      status: 'skipped',
      errorCode: 'MISSING_TO',
      errorMessage: 'Missing email "to"',
    };
  }

  const sgKey = process.env.SENDGRID_API_KEY || '';
  const sgFrom = process.env.SENDGRID_FROM || '';

  if (!sgKey || !sgFrom) {
    return {
      provider: 'email',
      status: 'skipped',
      errorCode: 'NO_PROVIDER',
      errorMessage: 'No email provider configured (SENDGRID_API_KEY or SENDGRID_FROM missing)',
      meta: { hasKey: !!sgKey, hasFrom: !!sgFrom },
    };
  }

  try {
    const { email: fromEmail, name: fromName } = parseFrom(sgFrom);

    // Nội dung
    const plainText = [safeTrim(payload.body), safeTrim(payload.actionUrl)]
      .filter(Boolean)
      .join('\n\n');

    const html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5">
        <h2 style="margin:0 0 8px">${escapeHtml(payload.title || '')}</h2>
        <p style="margin:0 0 12px;white-space:pre-line">${escapeHtml(payload.body || '')}</p>
        ${
          payload.actionUrl
            ? `<p style="margin:16px 0"><a href="${escapeAttr(payload.actionUrl)}" target="_blank" rel="noopener">Mở liên kết</a></p>`
            : ''
        }
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0" />
        <small style="color:#777">JOB: ${String(ctx.jobId ?? '')}</small>
      </div>
    `;

    const body = {
      personalizations: [
        {
          to: [{ email: target.to }],
          ...(target.cc?.length ? { cc: target.cc.map((e) => ({ email: e })) } : {}),
          ...(target.bcc?.length ? { bcc: target.bcc.map((e) => ({ email: e })) } : {}),
        },
      ],
      from: fromName ? { email: fromEmail, name: fromName } : { email: fromEmail },
      subject: payload.title || '(no subject)',
      content: [
        { type: 'text/plain', value: plainText || '' },
        { type: 'text/html', value: html },
      ],
      // Ví dụ thêm tag phân loại:
      // categories: ['beepbip', ctx.jobId ? `job:${ctx.jobId}` : undefined].filter(Boolean),
      // custom_args: { jobId: String(ctx.jobId ?? '') },
    };

    // Abort nếu quá 10s
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 10_000);

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sgKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    }).catch((err) => {
      // fetch throw (timeout/abort/DNS)
      throw toEnrichedError(err);
    });
    clearTimeout(timeout);

    const providerMessageId = res.headers.get('x-message-id') || undefined;

    if (!res.ok) {
      const raw = await res.text().catch(() => '');
      const retryAfterSec = parseRetryAfter(res.headers.get('retry-after'));
      const statusFamily = Math.floor(res.status / 100);
      const isRetryable = res.status === 429 || statusFamily === 5;

      return {
        provider: 'email',
        status: 'failed', // orchestrator có thể dựa vào meta.retryAfterSec để reschedule
        errorCode: String(res.status),
        errorMessage: `SendGrid ${res.statusText || 'error'}`,
        meta: {
          providerMessageId,
          retryAfterSec,
          responseSnippet: raw.slice(0, 500),
        },
      };
    }

    // SendGrid trả 202 Accepted khi thành công
    return { provider: 'email', status: 'sent', providerMessageId };
  } catch (e: any) {
    const err = toEnrichedError(e);
    return {
      provider: 'email',
      status: 'failed',
      errorCode: err.code,
      errorMessage: err.message,
      meta: err.meta,
    };
  }
}

/* ---------------- helpers ---------------- */

function safeTrim(s?: string) {
  return (s ?? '').trim();
}

function parseFrom(from: string): { email: string; name?: string } {
  // Hỗ trợ: "Tên Hiển Thị <email@domain>" hoặc chỉ "email@domain"
  const m = from.match(/^\s*(.+?)\s*<([^>]+)>\s*$/);
  if (m) {
    return { name: m[1].trim(), email: m[2].trim() };
  }
  return { email: from.trim() };
}

function parseRetryAfter(h?: string | null): number | undefined {
  if (!h) return undefined;
  if (/^\d+$/.test(h)) return Math.max(0, parseInt(h, 10));
  const t = Date.parse(h); // RFC-date
  if (Number.isFinite(t)) {
    const diff = Math.round((t - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
  }
  return undefined;
}

function toEnrichedError(e: any) {
  // Chuẩn hoá lỗi fetch/Abort
  if (e?.name === 'AbortError') {
    return { code: 'ABORTED', message: 'Email request aborted (timeout)', meta: {} };
  }
  return { code: e?.code || 'ERR_EMAIL', message: e?.message || String(e), meta: {} };
}

/** Rất gọn để tránh XSS trong HTML */
function escapeHtml(s: string) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}
function escapeAttr(s: string) {
  return escapeHtml(s).replaceAll('"', '&quot;');
}
