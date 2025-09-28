// functions/src/notifications/channelWorkers/sendFcm.ts
import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';
import { sendFcm as sendFcmProvider } from '../deliveryProviders/fcmProvider.js';

type SendPayload = { title: string; body: string; actionUrl?: string };

const REGION = 'asia-southeast1';
const INTERNAL_WORKER_SECRET = process.env.INTERNAL_WORKER_SECRET!; // set trong Secrets

export const sendFcm = functions
  .runWith({
    secrets: ['FCM_SERVER_KEY', 'INTERNAL_WORKER_SECRET'],
    timeoutSeconds: 30,
    memory: '256MB',
  })
  .region(REGION)
  .https.onRequest(async (req, res): Promise<void> => {
    try {
      if (req.method !== 'POST') { res.status(405).send('Method Not Allowed'); return; }

      // ⛔ chỉ orchestrator nội bộ mới được gọi
      if (req.header('x-internal-secret') !== INTERNAL_WORKER_SECRET) {
        res.status(401).send('Unauthorized'); return;
      }

      const { jobId, uid, payload, target } = req.body as {
        jobId: string;
        uid?: string;
        payload: SendPayload;
        target?: { tokens?: string[]; token?: string; topic?: string };
      };

      if (!jobId || !payload?.title || !payload?.body) {
        res.status(400).json({ ok: false, error: 'Missing jobId|payload' }); return;
      }

      // ✅ Chuẩn hoá target
      const safeTarget = target ?? {};
      const hasAnyTarget =
        (Array.isArray(safeTarget.tokens) && safeTarget.tokens.length > 0) ||
        !!safeTarget.token ||
        !!safeTarget.topic;

      if (!hasAnyTarget) {
        // Không có đích gửi: đánh dấu failed/hoặc skipped tuỳ policy
        const deliveryId = `${jobId}_push_${uid || 'unknown'}`;
        await db.collection('deliveries').doc(deliveryId).set({
          id: deliveryId,
          jobId,
          uid: uid ?? null,
          channel: 'push',
          status: 'failed',                    // hoặc 'skipped'
          errorMessage: 'No target token/topic',
          attempts: FieldValue.increment(1),
          createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        res.json({ ok: false, error: 'No target token/topic', deliveryId }); return;
      }

      // Gửi qua provider
      const result = await sendFcmProvider(safeTarget, payload, { jobId, uid });

      // ✅ Idempotent deliveryId
      const idKey = uid || safeTarget.topic || (safeTarget.token ? 'single' : 'multi');
      const deliveryId = `${jobId}_push_${idKey}`;

      await db.collection('deliveries').doc(deliveryId).set({
        id: deliveryId,
        jobId,
        uid: uid ?? null,
        channel: 'push',
        status: result.status,                 // 'sent' | 'failed' | 'skipped' (chuẩn hoá ở provider)
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
