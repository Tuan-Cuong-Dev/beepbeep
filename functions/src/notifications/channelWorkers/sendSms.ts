// functions/src/notifications/channelWorkers/sendSms.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js';
import { sendSms as sendSmsProvider } from '../deliveryProviders/smsProvider.js';

type SendPayload = { title: string; body: string; actionUrl?: string };

export const sendSms = functions
  .runWith({ timeoutSeconds: 15, memory: '128MB' }) // cấu hình runtime nhẹ
  .region('asia-southeast1')
  .https.onRequest(async (req, res) => {
    try {
      if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
      }

      const { jobId, uid, payload, target } = req.body as {
        jobId: string;
        uid?: string;
        payload: SendPayload;
        target?: { to?: string };
      };

      if (!jobId || !payload?.title || !payload?.body) {
        res.status(400).json({ ok: false, error: 'Missing jobId|payload' });
        return;
      }

      // ✅ đảm bảo có to:string (kể cả rỗng để hợp type)
      const smsTarget = { to: target?.to ?? '' };

      const result = await sendSmsProvider(smsTarget, payload, { jobId, uid });

      // ✅ key ổn định cho doc id
      const idKey = uid || smsTarget.to || 'unknown';
      const delivId = `${jobId}_sms_${idKey}`;

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
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
  });
