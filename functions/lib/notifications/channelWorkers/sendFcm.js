// functions/src/notifications/channelWorkers/sendFcm.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js';
import { sendFcm as sendFcmProvider } from '../deliveryProviders/fcmProvider.js';
export const sendFcm = functions
    .runWith({ secrets: ['FCM_SERVER_KEY'] }) // 👈 nạp secret cho prod & emulator
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
        // ✅ Đảm bảo target là object (có thể rỗng)
        const safeTarget = target || {};
        const result = await sendFcmProvider(safeTarget, payload, { jobId, uid });
        // ✅ Nếu không có uid, dùng topic hoặc 'unknown' cho key
        const idKey = uid || safeTarget.topic || 'unknown';
        const delivId = `${jobId}_push_${idKey}`;
        await db.collection('deliveries').doc(delivId).set({
            id: delivId,
            jobId,
            uid: uid ?? null,
            channel: 'push',
            status: result.status, // 'sent' | 'failed' | 'skipped'
            providerMessageId: result.providerMessageId ?? null,
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
            attempts: 1,
            createdAt: Date.now(),
            sentAt: result.status !== 'failed' ? Date.now() : null,
            meta: result.meta ?? null,
        });
        res.json({ ok: result.status !== 'failed', result, deliveryId: delivId });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
