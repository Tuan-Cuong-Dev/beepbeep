export async function sendZalo(target, payload, ctx) {
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
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json?.error) {
            return {
                provider: 'zalo',
                status: 'failed',
                errorCode: json?.error?.code?.toString?.(),
                errorMessage: json?.error?.message || `HTTP ${res.status}`,
                meta: (json ?? {}),
            };
        }
        return {
            provider: 'zalo',
            status: 'sent',
            providerMessageId: json?.message_id || json?.data?.message_id,
            meta: (json ?? {}),
        };
    }
    catch (e) {
        return {
            provider: 'zalo',
            status: 'failed',
            errorCode: e?.code,
            errorMessage: e?.message || String(e),
        };
    }
}
