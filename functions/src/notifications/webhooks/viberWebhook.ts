// functions/src/notifications/webhooks/viberWebhook.ts
import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';

export const viberWebhook = functions
  .region('asia-southeast1')
  .https.onRequest(async (req, res) => {
    try {
      const body = req.body as any;
      const event = body?.event;
      const token = body?.message_token;
      const now = Date.now();

      if (!token) { functions.logger.warn('Viber webhook: missing message_token', body); res.json({ ok:true }); return; }

      const q = await db.collection('deliveries')
        .where('providerMessageId', '==', String(token)).limit(1).get();

      if (!q.empty) {
        const ref = q.docs[0].ref;
        let status: 'delivered'|'read'|'failed'|'sent' = 'sent';
        if (event === 'delivered') status = 'delivered';
        else if (event === 'seen') status = 'read';
        else if (event === 'failed') status = 'failed';

        await ref.update({
          status,
          deliveredAt: event === 'delivered' ? now : FieldValue.delete(),
          readAt:      event === 'seen'      ? now : FieldValue.delete(),
          updatedAt: now,
          meta: FieldValue.arrayUnion({ source:'viber', event, raw: body, at: now }),
        });
      } else {
        functions.logger.warn('Viber webhook: delivery not found for token', token);
      }

      res.json({ ok:true }); return;
    } catch (e:any) {
      functions.logger.error('Viber webhook error', e);
      res.status(200).json({ ok:true });
    }
  });
