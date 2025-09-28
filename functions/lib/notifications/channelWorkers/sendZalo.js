// functions/src/notifications/channelWorkers/sendZalo.ts
// Date 27/09
import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';
import { sendZalo as sendZaloProvider } from '../deliveryProviders/zaloProvider.js';
const REGION = 'asia-southeast1';
// Loại bỏ mọi field undefined trước khi ghi Firestore
function stripUndefined(input) {
    return JSON.parse(JSON.stringify(input ?? null));
}
export const sendZalo = functions
    .runWith({
    // cần APP_ID & APP_SECRET vì provider có thể gọi refresh OAuth
    secrets: ['INTERNAL_WORKER_SECRET', 'ZALO_APP_ID', 'ZALO_APP_SECRET', 'ZALO_OA_TOKEN'],
    timeoutSeconds: 15,
    memory: '128MB',
})
    .region(REGION)
    .https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }
        // ✅ ĐỌC SECRET NGAY TRONG HANDLER (tránh lỗi cold start/bị cache)
        const expected = (process.env.INTERNAL_WORKER_SECRET || '').trim();
        const got = (req.get('x-internal-secret') || '').trim();
        if (!expected || got !== expected) {
            res.status(401).send('Unauthorized');
            return;
        }
        const { jobId, uid, payload, target } = req.body;
        if (!jobId || !payload?.title || !payload?.body) {
            res.status(400).json({ ok: false, error: 'Missing jobId|payload' });
            return;
        }
        const zaloUserId = target?.zaloUserId?.trim();
        const phone = target?.phone?.trim();
        // CS: bắt buộc phải có zaloUserId
        if (!zaloUserId) {
            const deliveryId = `${jobId}_zalo_${uid || phone || 'unknown'}`;
            await db.collection('deliveries').doc(deliveryId).set({
                id: deliveryId,
                jobId,
                uid: uid ?? null,
                channel: 'zalo',
                status: 'failed',
                errorMessage: 'zaloUserId is required for CS channel',
                attempts: FieldValue.increment(1),
                createdAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            res.json({ ok: false, error: 'zaloUserId is required for CS channel', deliveryId });
            return;
        }
        // target chuẩn, không undefined
        const targetCS = { zaloUserId };
        if (phone)
            targetCS.phone = phone;
        const result = await sendZaloProvider(targetCS, payload, { jobId, uid });
        const providerId = result.providerMessageId ?? 'mock_msg_1';
        const deliveryId = `${jobId}_zalo_${uid || zaloUserId}`;
        await db.collection('deliveries').doc(deliveryId).set({
            id: deliveryId,
            jobId,
            uid: uid ?? null,
            channel: 'zalo',
            status: result.status, // 'sent' | 'failed' | 'skipped'
            providerMessageId: providerId,
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
            meta: stripUndefined(result.meta ?? null),
            attempts: FieldValue.increment(1),
            createdAt: FieldValue.serverTimestamp(),
            sentAt: result.status !== 'failed' ? FieldValue.serverTimestamp() : null,
        }, { merge: true });
        res.json({ ok: result.status !== 'failed', result, deliveryId });
        return;
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
        return;
    }
});
//# sourceMappingURL=sendZalo.js.map