// functions/src/notifications/channelWorkers/sendZalo.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js';
import { sendZalo as sendZaloProvider } from '../deliveryProviders/zaloProvider.js';
// util: loại bỏ tất cả field undefined (tránh lỗi Firestore)
function stripUndefined(input) {
    return JSON.parse(JSON.stringify(input ?? null));
}
export const sendZalo = functions
    .runWith({ secrets: ['ZALO_OA_TOKEN'], timeoutSeconds: 15, memory: '128MB' })
    .region('asia-southeast1')
    .https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }
        const { jobId, uid, payload, target } = req.body;
        if (!jobId || !payload?.title || !payload?.body) {
            res.status(400).json({ ok: false, error: 'Missing jobId|payload' });
            return;
        }
        // Chuẩn hoá target (không để undefined)
        const zaloTarget = {
            zaloUserId: target?.zaloUserId ?? '',
            // chỉ thêm phone nếu có (tránh undefined chui vào meta)
            ...(target?.phone ? { phone: target.phone } : {}),
        };
        const result = await sendZaloProvider(zaloTarget, payload, { jobId, uid });
        // 🔴 DEMO MODE: nếu provider không trả id → gán luôn 'mock_msg_1'
        const providerId = result.providerMessageId ?? 'mock_msg_1';
        const idKey = uid || zaloTarget.zaloUserId || 'unknown';
        const delivId = `${jobId}_zalo_${idKey}`;
        // loại bỏ field undefined trước khi ghi
        const stripUndefined = (x) => JSON.parse(JSON.stringify(x ?? null));
        await db.collection('deliveries').doc(delivId).set({
            id: delivId,
            jobId,
            uid: uid ?? null,
            channel: 'zalo',
            status: result.status, // 'sent' | 'failed' | 'skipped'
            providerMessageId: providerId, // ✅ luôn có giá trị
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
            attempts: 1,
            createdAt: Date.now(),
            sentAt: result.status !== 'failed' ? Date.now() : null,
            meta: stripUndefined(result.meta ?? null),
        });
        res.json({ ok: result.status !== 'failed', result, deliveryId: delivId });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
