// functions/src/notifications/channelWorkers/sendInapp.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js';
export const sendInapp = functions
    .runWith({ timeoutSeconds: 15, memory: '128MB' })
    .region('asia-southeast1')
    .https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }
        const { jobId, uid, payload, topic } = req.body;
        if (!jobId || !uid || !payload?.title || !payload?.body) {
            res.status(400).json({ ok: false, error: 'Missing jobId|uid|payload' });
            return;
        }
        const normalizedTopic = (topic ?? 'system').trim() || 'system';
        const notifRef = db.collection('user_notifications').doc(uid).collection('items').doc();
        await notifRef.set({
            id: notifRef.id,
            uid,
            topic: normalizedTopic,
            title: payload.title,
            body: payload.body,
            actionUrl: payload.actionUrl ?? null,
            read: false,
            // createdAt: admin.firestore.FieldValue.serverTimestamp(), // (tuỳ chọn)
            createdAt: Date.now(),
            meta: {
                jobId,
                source: 'sendInapp',
            },
        });
        const delivId = `${jobId}_inapp_${uid}`;
        await db.collection('deliveries').doc(delivId).set({
            id: delivId,
            jobId,
            uid,
            channel: 'inapp',
            status: 'delivered',
            // createdAt: admin.firestore.FieldValue.serverTimestamp(), // (tuỳ chọn)
            // deliveredAt: admin.firestore.FieldValue.serverTimestamp(), // (tuỳ chọn)
            createdAt: Date.now(),
            deliveredAt: Date.now(),
            meta: {
                notificationId: notifRef.id,
                topic: normalizedTopic,
            },
        });
        res.json({ ok: true, deliveryId: delivId, notificationId: notifRef.id });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
