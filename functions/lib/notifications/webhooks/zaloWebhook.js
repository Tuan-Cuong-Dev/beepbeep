// ESM/NodeNext
import * as functions from 'firebase-functions';
import crypto from 'crypto';
import { db, FieldValue } from '../../utils/db.js';
const REGION = 'asia-southeast1';
// So sánh an toàn, hỗ trợ hex/base64
function safeEqual(a, b) {
    const A = Buffer.from(a);
    const B = Buffer.from(b);
    return A.length === B.length && crypto.timingSafeEqual(A, B);
}
// Verify chữ ký: HMAC-SHA256(rawBody, APP_SECRET)
function verifySignature(req, appSecret) {
    if (!appSecret)
        return true; // chưa bật secret → bỏ qua
    const sig = (req.get('x-zalo-signature') || '').trim();
    if (!sig)
        return false;
    const raw = req.rawBody?.length
        ? req.rawBody.toString('utf8')
        : JSON.stringify(req.body ?? {});
    const h = crypto.createHmac('sha256', appSecret);
    h.update(raw);
    const hex = h.digest('hex');
    const b64 = Buffer.from(hex, 'hex').toString('base64');
    return safeEqual(sig.toLowerCase(), hex.toLowerCase()) || safeEqual(sig, b64);
}
// Parse mã liên kết từ tin nhắn, ví dụ: "LINK-ABC123"
function parseLinkCode(text) {
    if (!text)
        return null;
    const m = text.match(/\bLINK-([A-Z0-9\-._]{4,64})\b/i);
    return m ? m[1] : null;
}
export const zaloWebhook = functions
    .runWith({ secrets: ['ZALO_APP_SECRET'] })
    .region(REGION)
    .https.onRequest(async (req, res) => {
    try {
        if (req.method !== 'POST') {
            res.status(405).send('Method Not Allowed');
            return;
        }
        const APP_SECRET = process.env.ZALO_APP_SECRET || '';
        // (khuyến nghị) bật verify chữ ký để ngăn request giả
        if (!verifySignature(req, APP_SECRET)) {
            functions.logger.warn('Invalid signature');
            res.status(401).send('Invalid signature');
            return;
        }
        const body = req.body;
        const event = (body?.event_name || body?.event || '').toLowerCase();
        // Một số trường hay dùng
        const zaloUserId = body?.sender?.id || body?.follower?.id || body?.user_id || body?.user?.id;
        // 1) user_send_text + mã LINK-XXXX  → map zaloUserId ↔ uid
        if (event === 'user_send_text') {
            const text = body?.message?.text;
            const code = parseLinkCode(text);
            // Cập nhật lastSeenAt + có thể lưu transcript tuỳ nhu cầu
            if (zaloUserId) {
                await db.doc(`zalo_oa/users/${zaloUserId}`).set({ lastSeenAt: FieldValue.serverTimestamp(), lastMessage: text ?? null }, { merge: true });
            }
            if (!code || !zaloUserId) {
                res.json({ ok: true, handled: 'user_send_text', linked: false });
                return;
            }
            // Optional: tra cứu link code → uid (tuỳ cơ chế của bạn)
            // Giả sử bạn có collection linkCodes/{code} = { uid, status:'active' }
            const linkDoc = await db.doc(`linkCodes/${code}`).get().catch(() => null);
            const uid = linkDoc?.exists ? linkDoc.data()?.uid : undefined;
            if (!uid) {
                // Nếu bạn không dùng linkCodes, có thể tự quy ước code = uid
                // const uid = code;
                res.json({ ok: true, handled: 'link_code_not_found', code });
                return;
            }
            // Ghi map zalo ↔ uid
            await db.doc(`zalo_oa/users/${zaloUserId}`).set({ linkedUid: uid, linkedAt: FieldValue.serverTimestamp(), followed: true }, { merge: true });
            await db.doc(`users/${uid}`).set({ contact: { zaloUserId } }, { merge: true });
            // (Tuỳ chọn) vô hiệu hoá code sau khi dùng
            await db.doc(`linkCodes/${code}`).set({ status: 'used', usedAt: FieldValue.serverTimestamp(), usedBy: zaloUserId }, { merge: true });
            res.json({ ok: true, handled: 'link', zaloUserId, uid, code });
            return;
        }
        // 2) user_follow → đánh dấu theo dõi
        if (event === 'user_follow') {
            if (zaloUserId) {
                await db.doc(`zalo_oa/users/${zaloUserId}`).set({ followed: true, lastSeenAt: FieldValue.serverTimestamp() }, { merge: true });
            }
            res.json({ ok: true, handled: 'follow', zaloUserId });
            return;
        }
        // 3) user_unfollow → không gửi nữa
        if (event === 'user_unfollow') {
            if (zaloUserId) {
                await db.doc(`zalo_oa/users/${zaloUserId}`).set({ followed: false, unfollowedAt: FieldValue.serverTimestamp() }, { merge: true });
            }
            res.json({ ok: true, handled: 'unfollow', zaloUserId });
            return;
        }
        // 4) message_status / delivered / seen / failed → cập nhật deliveries
        //    (có thể đến từ nhiều tên event khác nhau)
        const messageId = body?.message?.msg_id || body?.message_id || body?.data?.message_id;
        const status = (body?.status || body?.data?.status || '').toLowerCase();
        if (messageId) {
            const q = await db
                .collection('deliveries')
                .where('providerMessageId', '==', String(messageId))
                .limit(1)
                .get();
            if (!q.empty) {
                const ref = q.docs[0].ref;
                const now = Date.now();
                const mapped = status.includes('seen') || status.includes('read')
                    ? 'read'
                    : status.includes('deliver')
                        ? 'delivered'
                        : status.includes('fail') || status.includes('error')
                            ? 'failed'
                            : 'sent';
                await ref.update({
                    status: mapped,
                    deliveredAt: mapped === 'delivered' ? now : FieldValue.delete(),
                    readAt: mapped === 'read' ? now : FieldValue.delete(),
                    updatedAt: now,
                    meta: FieldValue.arrayUnion({
                        source: 'zalo',
                        eventName: event || 'message_status',
                        raw: body,
                        at: now,
                    }),
                });
            }
            else {
                functions.logger.warn('Zalo webhook: delivery not found', { messageId, event, status });
            }
            res.json({ ok: true, handled: 'status', messageId, status });
            return;
        }
        // 5) Không rơi vào các case trên → log và OK (tránh retry ồ ạt)
        functions.logger.info('Unhandled Zalo event', { event, body });
        res.json({ ok: true, handled: 'unknown' });
    }
    catch (e) {
        functions.logger.error('Zalo webhook error', e);
        // Trả 200 để OA không retry quá đà (tuỳ bạn)
        res.status(200).json({ ok: true, error: 'logged' });
    }
});
//# sourceMappingURL=zaloWebhook.js.map