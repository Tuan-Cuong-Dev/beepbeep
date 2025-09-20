// functions/src/notifications/channelWorkers/sendZalo.ts
import * as functions from 'firebase-functions';
import { db } from '../../utils/db.js'; // initializeApp + getFirestore
import { sendZalo as sendZaloProvider } from '../deliveryProviders/zaloProvider.js';

type SendPayload = { title: string; body: string; actionUrl?: string };

export const sendZalo = functions
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
        target?: { zaloUserId?: string; phone?: string };
      };

      if (!jobId || !payload?.title || !payload?.body) {
        res.status(400).json({ ok: false, error: 'Missing jobId|payload' });
        return;
      }

      // Chuẩn hoá target
      const zaloTarget = {
        zaloUserId: target?.zaloUserId ?? '',
        phone: target?.phone,
      };

      const result = await sendZaloProvider(zaloTarget, payload, { jobId, uid });

      const idKey = uid || zaloTarget.zaloUserId || 'unknown';
      const delivId = `${jobId}_zalo_${idKey}`;

      await db.collection('deliveries').doc(delivId).set({
        id: delivId,
        jobId,
        uid: uid ?? null,
        channel: 'zalo',
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
