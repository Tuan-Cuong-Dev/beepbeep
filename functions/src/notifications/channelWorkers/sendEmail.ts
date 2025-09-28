// functions/src/notifications/channelWorkers/sendEmail.ts
// Date 27/09
import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';
import { sendEmail as sendEmailProvider } from '../deliveryProviders/emailProvider.js';

type SendPayload = { title: string; body: string; actionUrl?: string };

const REGION = 'asia-southeast1';
const INTERNAL_WORKER_SECRET = process.env.INTERNAL_WORKER_SECRET!;

export const sendEmail = functions
  .runWith({
    secrets: ['SENDGRID_API_KEY', 'INTERNAL_WORKER_SECRET'],
    timeoutSeconds: 30,
    memory: '256MB',
  })
  .region(REGION)
  .https.onRequest(async (req, res): Promise<void> => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed'); return;
      }
      if (req.header('x-internal-secret') !== INTERNAL_WORKER_SECRET) {
        res.status(401).send('Unauthorized'); return;
      }

      const { jobId, uid, payload, target } = req.body as {
        jobId: string;
        uid?: string;
        payload: SendPayload;
        target?: { to?: string };
      };

      if (!jobId || !payload?.title || !payload?.body) {
        res.status(400).json({ ok: false, error: 'Missing jobId|payload' }); return;
      }

      const to = target?.to?.trim();
      if (!to) {
        res.status(400).json({ ok: false, error: 'Missing target.to' }); return;
      }

      const result = await sendEmailProvider({ to }, payload, { jobId, uid });
      const deliveryId = `${jobId}_email_${uid || to}`;

      await db.collection('deliveries').doc(deliveryId).set({
        id: deliveryId,
        jobId,
        uid: uid ?? null,
        channel: 'email',
        status: result.status, // 'sent' | 'queued' | 'failed'
        providerMessageId: result.providerMessageId ?? null,
        errorCode: result.errorCode ?? null,
        errorMessage: result.errorMessage ?? null,
        attempts: FieldValue.increment(1),
        createdAt: FieldValue.serverTimestamp(),
        sentAt: result.status !== 'failed' ? FieldValue.serverTimestamp() : null,
      }, { merge: true });

      res.json({ ok: result.status !== 'failed', result, deliveryId }); return;
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || String(e) }); return;
    }
  });
