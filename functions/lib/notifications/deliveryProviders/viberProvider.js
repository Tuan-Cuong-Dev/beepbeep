export async function sendViber(target, payload, ctx) {
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
        const json = await res.json().catch(() => ({}));
        if (json?.status !== 0) {
            return {
                provider: 'viber',
                status: 'failed',
                errorCode: String(json?.status),
                errorMessage: json?.status_message || `HTTP ${res.status}`,
                meta: (json ?? {}),
            };
        }
        return {
            provider: 'viber',
            status: 'sent',
            providerMessageId: json?.message_token?.toString?.(),
            meta: (json ?? {}),
        };
    }
    catch (e) {
        return {
            provider: 'viber',
            status: 'failed',
            errorCode: e?.code,
            errorMessage: e?.message || String(e),
        };
    }
}
