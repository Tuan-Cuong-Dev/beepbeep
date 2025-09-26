export async function sendZalo(target, payload, ctx) {
    const isEmu = process.env.FUNCTIONS_EMULATOR === 'true' ||
        !!process.env.FIREBASE_EMULATOR_HUB;
    // ✅ Emulator: không gọi ra ngoài, trả kết quả giả lập
    if (isEmu) {
        return {
            provider: 'zalo',
            status: 'sent',
            providerMessageId: `emul_${Date.now()}`,
            meta: { emulated: true, target, payload, jobId: ctx.jobId },
        };
    }
    // 🧰 Validate tối thiểu
    if (!target?.zaloUserId || typeof target.zaloUserId !== 'string') {
        return {
            provider: 'zalo',
            status: 'skipped',
            errorCode: 'BAD_TARGET',
            errorMessage: 'Missing or invalid target.zaloUserId',
        };
    }
    const token = process.env.ZALO_OA_TOKEN || '';
    if (!token) {
        return {
            provider: 'zalo',
            status: 'failed',
            errorCode: 'NO_TOKEN',
            errorMessage: 'ZALO_OA_TOKEN is missing (set Secret in Functions).',
        };
    }
    // ✉️ Nội dung text
    const text = `${payload.title ?? ''}\n${payload.body ?? ''}` +
        (payload.actionUrl ? `\n${payload.actionUrl}` : '');
    // ⏱️ Timeout an toàn để không treo function
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s
    try {
        const res = await fetch('https://openapi.zalo.me/v3.0/oa/message', {
            method: 'POST',
            headers: {
                'access_token': token, // Zalo OA yêu cầu header này
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                recipient: { user_id: target.zaloUserId },
                message: { text },
                tracking_id: ctx.jobId,
            }),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeout));
        // Zalo trả về JSON cả khi lỗi
        const json = await res.json().catch(() => ({}));
        // ❌ HTTP lỗi hoặc payload có error từ Zalo
        if (!res.ok || json?.error) {
            return {
                provider: 'zalo',
                status: 'failed',
                errorCode: json?.error?.code?.toString?.() ?? String(res.status),
                errorMessage: json?.error?.message || `HTTP ${res.status}`,
                meta: { responseStatus: res.status, ...(json ?? {}) },
            };
        }
        // ✅ Thành công
        const pmid = json?.message_id ??
            json?.data?.message_id ??
            undefined;
        return {
            provider: 'zalo',
            status: 'sent',
            providerMessageId: pmid ? String(pmid) : undefined,
            meta: { responseStatus: res.status, ...(json ?? {}) },
        };
    }
    catch (e) {
        return {
            provider: 'zalo',
            status: 'failed',
            errorCode: e?.code || 'FETCH_ERROR',
            errorMessage: e?.message || String(e),
        };
    }
}
