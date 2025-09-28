// functions/src/notifications/channelWorkers/sendInapp.ts
// Date 27/09
import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';
const REGION = 'asia-southeast1';
const INTERNAL_WORKER_SECRET = process.env.INTERNAL_WORKER_SECRET;
export const sendInapp = functions
    .runWith({
    secrets: ['INTERNAL_WORKER_SECRET'],
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
        const { jobId, uid, payload, topic } = req.body;
        if (!jobId || !uid || !payload?.title || !payload?.body) {
            res.status(400).json({ ok: false, error: 'Missing jobId|uid|payload' });
            return;
        }
        const normalizedTopic = (topic ?? 'system').trim() || 'system';
        // Tạo notification in-app cho user
        const notifRef = db.collection('user_notifications').doc(uid).collection('items').doc();
        await notifRef.set({
            id: notifRef.id,
            uid,
            topic: normalizedTopic,
            title: payload.title,
            body: payload.body,
            actionUrl: payload.actionUrl ?? null,
            read: false,
            createdAt: FieldValue.serverTimestamp(),
            meta: { jobId, source: 'sendInapp' },
        });
        // Ghi delivery log (idempotent qua key jobId+inapp+uid)
        const deliveryId = `${jobId}_inapp_${uid}`;
        await db.collection('deliveries').doc(deliveryId).set({
            id: deliveryId,
            jobId,
            uid,
            channel: 'inapp',
            status: 'delivered',
            attempts: FieldValue.increment(1),
            createdAt: FieldValue.serverTimestamp(),
            deliveredAt: FieldValue.serverTimestamp(),
            meta: { notificationId: notifRef.id, topic: normalizedTopic },
        }, { merge: true });
        res.json({ ok: true, deliveryId, notificationId: notifRef.id });
        return;
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
        return;
    }
});
//# sourceMappingURL=sendInapp.js.map