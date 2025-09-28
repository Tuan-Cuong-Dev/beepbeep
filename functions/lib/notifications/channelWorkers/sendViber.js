// functions/src/notifications/channelWorkers/sendViber.ts
// Date 27/09
import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';
import { sendViber as sendViberProvider } from '../deliveryProviders/viberProvider.js';
const REGION = 'asia-southeast1';
const INTERNAL_WORKER_SECRET = process.env.INTERNAL_WORKER_SECRET; // set trong Secrets
export const sendViber = functions
    .runWith({
    secrets: ['VIBER_BOT_TOKEN', 'INTERNAL_WORKER_SECRET'],
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
        if (req.header('x-internal-secret') !== INTERNAL_WORKER_SECRET) {
            res.status(401).send('Unauthorized');
            return;
        }
        const { jobId, uid, payload, target } = req.body;
        if (!jobId || !payload?.title || !payload?.body) {
            res.status(400).json({ ok: false, error: 'Missing jobId|payload' });
            return;
        }
        const viberUserId = target?.viberUserId?.trim();
        if (!viberUserId) {
            const deliveryId = `${jobId}_viber_${uid || 'unknown'}`;
            await db.collection('deliveries').doc(deliveryId).set({
                id: deliveryId,
                jobId,
                uid: uid ?? null,
                channel: 'viber',
                status: 'failed', // hoặc 'skipped' tuỳ policy
                errorMessage: 'Missing target.viberUserId',
                attempts: FieldValue.increment(1),
                createdAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            res.json({ ok: false, error: 'Missing target.viberUserId', deliveryId });
            return;
        }
        // Gửi qua provider
        const result = await sendViberProvider({ viberUserId }, payload, { jobId, uid });
        // Idempotent key
        const deliveryId = `${jobId}_viber_${uid || viberUserId}`;
        await db.collection('deliveries').doc(deliveryId).set({
            id: deliveryId,
            jobId,
            uid: uid ?? null,
            channel: 'viber',
            status: result.status, // 'sent' | 'failed' | 'skipped'
            providerMessageId: result.providerMessageId ?? null,
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
            meta: result.meta ?? null,
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
//# sourceMappingURL=sendViber.js.map