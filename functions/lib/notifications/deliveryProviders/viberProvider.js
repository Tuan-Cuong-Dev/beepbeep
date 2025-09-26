export async function sendViber(target, payload, ctx) {
    try {
        const token = process.env.VIBER_BOT_TOKEN || '';
        // Guard điều kiện tối thiểu
        if (!token) {
            return {
                provider: 'viber',
                status: 'skipped',
                errorCode: 'MISSING_TOKEN',
                errorMessage: 'VIBER_BOT_TOKEN is not set',
            };
        }
        if (!target?.viberUserId) {
            return {
                provider: 'viber',
                status: 'skipped',
                errorCode: 'MISSING_TARGET',
                errorMessage: 'viberUserId is required',
            };
        }
        // Ghép message gọn gàng
        const parts = [payload.title?.trim(), payload.body?.trim(), payload.actionUrl?.trim()].filter(Boolean);
        const text = parts.join('\n');
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
                tracking_data: ctx.jobId, // để đối soát ngược về deliveries
            }),
        });
        const json = (await res.json().catch(() => ({})));
        // Viber: status === 0 => OK
        if (!res.ok || json?.status !== 0) {
            return {
                provider: 'viber',
                status: 'failed',
                errorCode: String(json?.status ?? res.status),
                errorMessage: json?.status_message || `HTTP ${res.status}`,
                meta: json,
            };
        }
        return {
            provider: 'viber',
            status: 'sent',
            providerMessageId: json?.message_token?.toString?.(),
            meta: json,
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
