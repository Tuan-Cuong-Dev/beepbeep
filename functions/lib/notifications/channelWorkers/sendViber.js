// functions/src/notifications/channelWorkers/sendViber.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js';
import { sendViber as sendViberProvider } from '../deliveryProviders/viberProvider.js';
export const sendViber = functions
    .runWith({ secrets: ['VIBER_BOT_TOKEN'], timeoutSeconds: 15, memory: '128MB' })
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
        // ✅ bảo đảm luôn có viberUserId dạng string
        const viberTarget = { viberUserId: target?.viberUserId ?? '' };
        const result = await sendViberProvider(viberTarget, payload, { jobId, uid });
        const idKey = uid || viberTarget.viberUserId || 'unknown';
        const delivId = `${jobId}_viber_${idKey}`;
        await db.collection('deliveries').doc(delivId).set({
            id: delivId,
            jobId,
            uid: uid ?? null,
            channel: 'viber',
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
