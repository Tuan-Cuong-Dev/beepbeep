/**
 * Viber Bot (Public Account) API
 * Docs: https://developers.viber.com/docs/api/rest-bot-api/
 *
 * ENV:
 * - VIBER_BOT_TOKEN (Secret)
 *
 * Yêu cầu: user đã "Start" bot → có viberUserId (lấy từ webhook conversation_started).
 */
// Date 27/09

import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface ViberTarget { viberUserId: string }

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

export async function sendViber(
  target: ViberTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  try {
    const token = process.env.VIBER_BOT_TOKEN || '';
    if (!token) {
      return { provider: 'viber', status: 'skipped', errorCode: 'MISSING_TOKEN', errorMessage: 'VIBER_BOT_TOKEN is not set' };
    }
    if (!target?.viberUserId) {
      return { provider: 'viber', status: 'skipped', errorCode: 'MISSING_TARGET', errorMessage: 'viberUserId is required' };
    }

    const parts = [payload.title?.trim(), payload.body?.trim(), payload.actionUrl?.trim()].filter(Boolean);
    const text = parts.join('\n').trim();
    if (!text) {
      return { provider: 'viber', status: 'skipped', errorCode: 'EMPTY_MESSAGE', errorMessage: 'Empty message content' };
    }

    // Timeout 10s để tránh treo
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 10_000);

    const res = await fetch('https://chatapi.viber.com/pa/send_message', {
      method: 'POST',
      headers: {
        'X-Viber-Auth-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver: target.viberUserId,
        type: 'text',
        text,
        tracking_data: ctx.jobId ?? undefined, // để đối soát ngược về deliveries
        // optional:
        // keyboard: {...}, // nếu muốn nút bấm
        // sender: { name: 'Beep Bip', avatar: 'https://...' },
      }),
      signal: ctrl.signal,
    }).catch((e) => { throw { code: 'FETCH_ERR', message: String(e) }; });

    clearTimeout(to);

    const json = (await res.json().catch(() => ({}))) as Record<string, any>;
    // Viber: status === 0 => OK
    if (!res.ok || json?.status !== 0) {
      const retryAfterSec = parseRetryAfter(res.headers.get('retry-after'));
      const statusFamily = Math.floor(res.status / 100);
      const retryable = res.status === 429 || statusFamily === 5;

      return {
        provider: 'viber',
        status: 'failed',
        errorCode: String(json?.status ?? res.status),
        errorMessage: json?.status_message || `HTTP ${res.status}`,
        meta: {
          ...json,
          retryAfterSec,
          retryable,
          responseSnippet: JSON.stringify(json).slice(0, 500),
        },
      };
    }

    return {
      provider: 'viber',
      status: 'sent',
      providerMessageId: json?.message_token?.toString?.(),
      meta: json,
    };
  } catch (e: any) {
    return {
      provider: 'viber',
      status: 'failed',
      errorCode: e?.code,
      errorMessage: e?.message || String(e),
    };
  }
}
