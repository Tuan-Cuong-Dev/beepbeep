// functions/src/notifications/channelWorkers/sendEmail.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js';
import { sendEmail as sendEmailProvider } from '../deliveryProviders/emailProvider.js';
export const sendEmail = functions
    .runWith({ secrets: ['SENDGRID_API_KEY'] }) // 👈 gắn secret để prod & emulator nạp biến môi trường
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
        const emailTarget = { to: target?.to ?? '' };
        const result = await sendEmailProvider(emailTarget, payload, { jobId, uid });
        const delivId = `${jobId}_email_${uid || emailTarget.to || 'unknown'}`;
        await db.collection('deliveries').doc(delivId).set({
            id: delivId,
            jobId,
            uid: uid ?? null,
            channel: 'email',
            status: result.status,
            providerMessageId: result.providerMessageId ?? null,
            errorCode: result.errorCode ?? null,
            errorMessage: result.errorMessage ?? null,
            attempts: 1,
            createdAt: Date.now(),
            sentAt: result.status !== 'failed' ? Date.now() : null,
        });
        res.json({ ok: result.status !== 'failed', result, deliveryId: delivId });
    }
    catch (e) {
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
