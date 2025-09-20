export async function sendSms(target, payload, ctx) {
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
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                provider: 'sms',
                status: 'failed',
                errorCode: json?.code?.toString?.(),
                errorMessage: json?.message || `HTTP ${res.status}`,
                meta: (json ?? {}),
            };
        }
        return {
            provider: 'sms',
            status: 'sent',
            providerMessageId: json?.sid,
            meta: (json ?? {}),
        };
    }
    catch (e) {
        return {
            provider: 'sms',
            status: 'failed',
            errorCode: e?.code,
            errorMessage: e?.message || String(e),
        };
    }
}
