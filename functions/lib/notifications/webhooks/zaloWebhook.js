// functions/src/notifications/webhooks/zaloWebhook.ts
import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';
/**
 * Zalo OA webhook:
 * - Cấu hình URL này trong OA dashboard.
 * - (Optional) Xác minh chữ ký nếu OA bật ký.
 * - Payload có thể chứa trạng thái delivered/read/failed tuỳ sự kiện.
 */
export const zaloWebhook = functions
    .region('asia-southeast1')
    .https.onRequest(async (req, res) => {
    try {
        // (Optional) verify signature
        // const sig = req.get('X-Zalo-Signature');
        // const secret = process.env.ZALO_OA_SECRET || '';
        // verifyHmac(sig, JSON.stringify(req.body), secret);
        const body = req.body;
        // Tuỳ loại event: message_status, user_follow, user_unfollow...
        const eventName = body?.event_name || body?.event || 'unknown';
        const messageId = body?.message?.msg_id || body?.message_id || body?.data?.message_id;
        const status = body?.status || body?.data?.status; // "delivered","seen","failed"...
        if (!messageId) {
            functions.logger.warn('Zalo webhook: missing message_id', body);
            res.json({ ok: true });
            return;
        }
        // Tìm delivery theo providerMessageId
        const q = await db
            .collection('deliveries')
            .where('providerMessageId', '==', String(messageId))
            .limit(1)
            .get();
        if (q.empty) {
            functions.logger.warn('Zalo webhook: delivery not found for message_id', messageId);
            res.json({ ok: true });
            return;
        }
        const ref = q.docs[0].ref;
        const now = Date.now();
        const mapStatus = (s) => {
            if (!s)
                return 'sent';
            const x = s.toLowerCase();
            if (x.includes('seen') || x.includes('read'))
                return 'read';
            if (x.includes('deliver'))
                return 'delivered';
            if (x.includes('fail') || x.includes('error'))
                return 'failed';
            return 'sent';
        };
        const mapped = mapStatus(status);
        await ref.update({
            status: mapped,
            deliveredAt: mapped === 'delivered' ? now : FieldValue.delete(),
            readAt: mapped === 'read' ? now : FieldValue.delete(),
            updatedAt: now,
            meta: FieldValue.arrayUnion({
                source: 'zalo',
                eventName,
                raw: body,
                at: now,
            }),
        });
        res.json({ ok: true });
        return;
    }
    catch (e) {
        functions.logger.error('Zalo webhook error', e);
        // Trả 200 để OA không retry quá đà
        res.status(200).json({ ok: true });
        return;
    }
});
