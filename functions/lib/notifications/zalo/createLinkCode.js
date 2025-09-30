import * as functions from 'firebase-functions';
import { db, FieldValue } from '../../utils/db.js';
const REGION = 'asia-southeast1';
const TTL_MINUTES = 10;
function genCode(len) {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < len; i++)
        s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}
export const createZaloLinkCode = functions
    .region(REGION)
    .https.onCall(async (data, ctx) => {
    if (!ctx.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Login required');
    }
    const uid = ctx.auth.uid;
    const length = Math.max(4, Math.min(12, Number(data?.length ?? 6)));
    const expiresAtMs = Date.now() + TTL_MINUTES * 60_000;
    // thử tối đa 5 lần để tìm mã trống
    for (let i = 0; i < 5; i++) {
        const code = genCode(length);
        const ref = db.collection('zalo_link_codes').doc(code);
        const snap = await ref.get();
        if (snap.exists)
            continue;
        await ref.set({
            uid,
            createdAt: FieldValue.serverTimestamp(),
            expiresAt: expiresAtMs,
            used: false,
        });
        return { code, expiresAtMs };
    }
    throw new functions.https.HttpsError('resource-exhausted', 'Cannot allocate code');
});
//# sourceMappingURL=createLinkCode.js.map