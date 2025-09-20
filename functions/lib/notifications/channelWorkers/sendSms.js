// functions/src/notifications/channelWorkers/sendSms.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js'; // getFirestore() đã init trong utils/db
import { sendSms as sendSmsProvider } from '../deliveryProviders/smsProvider.js';
export const sendSms = functions
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
        // Bảo đảm target luôn có to:string
        const smsTarget = { to: target?.to ?? '' };
        const result = await sendSmsProvider(smsTarget, payload, { jobId, uid });
        const delivId = `${jobId}_sms_${uid || smsTarget.to || 'unknown'}`;
        await db.collection('deliveries').doc(delivId).set({
            id: delivId,
            jobId,
            uid: uid ?? null,
            channel: 'sms',
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
        return;
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
        return;
    }
});
