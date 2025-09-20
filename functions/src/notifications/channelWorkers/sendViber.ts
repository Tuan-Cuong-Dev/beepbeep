// functions/src/notifications/channelWorkers/sendViber.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js'; // initializeApp + getFirestore được export ở đây
import { sendViber as sendViberProvider } from '../deliveryProviders/viberProvider.js';

type SendPayload = { title: string; body: string; actionUrl?: string };

export const sendViber = functions
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
        target?: { viberUserId?: string };
      };

      if (!jobId || !payload?.title || !payload?.body) {
        res.status(400).json({ ok: false, error: 'Missing jobId|payload' });
        return;
      }

      // Bảo đảm luôn có viberUserId string
      const viberTarget = { viberUserId: target?.viberUserId ?? '' };

      const result = await sendViberProvider(viberTarget, payload, { jobId, uid });

      const delivId = `${jobId}_viber_${uid || viberTarget.viberUserId || 'unknown'}`;

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
      return;
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e?.message || String(e) });
      return;
    }
  });
