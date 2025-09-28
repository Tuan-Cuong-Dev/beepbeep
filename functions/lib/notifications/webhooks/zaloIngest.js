// functions/src/notifications/webhooks/zaloIngest.ts
import * as functions from "firebase-functions";
import { db, FieldValue } from "../../utils/db.js";
const REGION = "asia-southeast1";
// Type guard cho nhánh link
function isLinkPayload(p) {
    return p.action === "link";
}
export const zaloIngest = functions
    .runWith({ secrets: ["INTERNAL_WORKER_SECRET"] })
    .region(REGION)
    .https.onRequest(async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const expected = (process.env.INTERNAL_WORKER_SECRET || "").trim();
        const got = (req.get("x-internal-secret") || "").trim();
        if (!expected || got !== expected) {
            res.status(401).send("Unauthorized");
            return;
        }
        const body = req.body;
        const now = Date.now();
        // follow
        if (body.action === "follow") {
            await db.doc(`zalo_oa/users/${body.zaloUserId}`).set({
                followed: true, lastSeenAt: now, updatedAt: now,
                events: FieldValue.arrayUnion({ type: "follow", at: now })
            }, { merge: true });
            res.json({ ok: true });
            return;
        }
        // unfollow
        if (body.action === "unfollow") {
            await db.doc(`zalo_oa/users/${body.zaloUserId}`).set({
                followed: false, lastSeenAt: now, updatedAt: now,
                events: FieldValue.arrayUnion({ type: "unfollow", at: now })
            }, { merge: true });
            res.json({ ok: true });
            return;
        }
        // link
        if (isLinkPayload(body)) {
            const { zaloUserId, code } = body;
            if (!code) {
                res.status(400).json({ ok: false, error: "MISSING_CODE" });
                return;
            }
            const codeRef = db.doc(`zalo_link_codes/${code}`);
            const snap = await codeRef.get();
            if (!snap.exists) {
                res.status(404).json({ ok: false, error: "CODE_NOT_FOUND" });
                return;
            }
            const data = snap.data();
            const uid = data?.uid;
            if (!uid) {
                res.status(400).json({ ok: false, error: "CODE_NO_UID" });
                return;
            }
            if (data.used) {
                res.status(400).json({ ok: false, error: "CODE_USED" });
                return;
            }
            if (data.expiresAt && data.expiresAt < now) {
                res.status(400).json({ ok: false, error: "CODE_EXPIRED" });
                return;
            }
            await db.doc(`userNotificationPreferences/${uid}`).set({
                contact: { zaloUserId }, updatedAt: now
            }, { merge: true });
            await db.doc(`zalo_oa/users/${zaloUserId}`).set({
                uid, followed: true, lastSeenAt: now, updatedAt: now
            }, { merge: true });
            await codeRef.set({ used: true, usedAt: now, zaloUserId }, { merge: true });
            res.json({ ok: true, uid, zaloUserId });
            return;
        }
        res.status(400).json({ ok: false, error: "BAD_ACTION" });
    }
    catch (e) {
        functions.logger.error("zaloIngest error", e);
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
//# sourceMappingURL=zaloIngest.js.map