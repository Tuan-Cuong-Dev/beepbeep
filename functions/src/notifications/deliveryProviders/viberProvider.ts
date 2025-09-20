/**
 * Viber Bot (Public Account) API
 * Tài liệu: https://developers.viber.com/docs/api/rest-bot-api/
 *
 * ENV cần có:
 * - VIBER_BOT_TOKEN
 *
 * Yêu cầu user đã "Start" bot → có viberUserId.
 */
import type { ProviderContext, ProviderResult, SendPayload } from './types.js';

export interface ViberTarget { viberUserId: string }

export async function sendViber(
  target: ViberTarget,
  payload: SendPayload,
  ctx: ProviderContext
): Promise<ProviderResult> {
  try {
    const res = await fetch('https://chatapi.viber.com/pa/send_message', {
      method: 'POST',
      headers: {
        'X-Viber-Auth-Token': process.env.VIBER_TOKEN || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        receiver: target.viberUserId,
        type: 'text',
        text: `${payload.title}\n${payload.body}${payload.actionUrl ? `\n${payload.actionUrl}` : ''}`,
        tracking_data: ctx.jobId,
      }),
    });

    const json: any = await res.json().catch(() => ({}));

    if (json?.status !== 0) {
      return {
        provider: 'viber',
        status: 'failed',
        errorCode: String(json?.status),
        errorMessage: json?.status_message || `HTTP ${res.status}`,
        meta: (json ?? {}) as Record<string, any>,
      };
    }

    return {
      provider: 'viber',
      status: 'sent',
      providerMessageId: json?.message_token?.toString?.(),
      meta: (json ?? {}) as Record<string, any>,
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
