// functions/src/notifications/channelWorkers/sendSms.ts
// Date 27/09
import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';
import { sendSms as sendSmsProvider } from '../deliveryProviders/smsProvider.js';

type SendPayload = { title: string; body: string; actionUrl?: string };

const REGION = 'asia-southeast1';
const INTERNAL_WORKER_SECRET = process.env.INTERNAL_WORKER_SECRET!; // set bằng Secret Manager

export const sendSms = functions
  .runWith({
    secrets: ['INTERNAL_WORKER_SECRET', /* ví dụ: 'TWILIO_API_KEY', 'VIETTEL_API_KEY' */],
    timeoutSeconds: 15,
    memory: '128MB',
  })
  .region(REGION)
  .https.onRequest(async (req, res): Promise<void> => {
    try {
      if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }
      if (req.header('x-internal-secret') !== INTERNAL_WORKER_SECRET) { res.status(401).send('Unauthorized'); return; }

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
        const deliveryId = `${jobId}_sms_${uid || 'unknown'}`;
        await db.collection('deliveries').doc(deliveryId).set({
          id: deliveryId,
          jobId,
          uid: uid ?? null,
          channel: 'sms',
          status: 'failed', // hoặc 'skipped' tuỳ policy
          errorMessage: 'Missing target.to',
          attempts: FieldValue.increment(1),
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        res.json({ ok: false, error: 'Missing target.to', deliveryId }); return;
      }

      // Gửi qua provider
      const result = await sendSmsProvider({ to }, payload, { jobId, uid });

      // Idempotent key
      const deliveryId = `${jobId}_sms_${uid || to}`;

      await db.collection('deliveries').doc(deliveryId).set({
        id: deliveryId,
        jobId,
        uid: uid ?? null,
        channel: 'sms',
        status: result.status, // 'sent' | 'failed' | 'skipped' (chuẩn hoá ở provider)
        providerMessageId: result.providerMessageId ?? null,
        errorCode: result.errorCode ?? null,
        errorMessage: result.errorMessage ?? null,
        meta: result.meta ?? null,
        attempts: FieldValue.increment(1),
        createdAt: FieldValue.serverTimestamp(),
        sentAt: result.status !== 'failed' ? FieldValue.serverTimestamp() : null,
      }, { merge: true });

      res.json({ ok: result.status !== 'failed', result, deliveryId }); return;
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || String(e) }); return;
    }
  });
