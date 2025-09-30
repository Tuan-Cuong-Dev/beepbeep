// functions/src/notifications/webhooks/zaloIngest.ts
import * as functions from "firebase-functions";
import { db, FieldValue } from "../../utils/db.js";
const REGION = "asia-southeast1";
const INTERNAL = process.env.INTERNAL_WORKER_SECRET;
// Top-level, rõ ràng: tránh path lẻ
const COLL_ZALO_USERS = "zalo_oa_users"; // docId = zaloUserId
const COLL_LINK_CODES = "zalo_link_codes"; // docId = code
export const zaloIngest = functions
    .runWith({ secrets: ["INTERNAL_WORKER_SECRET"] })
    .region(REGION)
    .https.onRequest(async (req, res) => {
    try {
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        if ((req.header("x-internal-secret") || "") !== INTERNAL) {
            res.status(401).send("Unauthorized");
            return;
        }
        const body = req.body;
        if (!body?.action) {
            res.status(400).json({ ok: false, error: "BAD_ACTION" });
            return;
        }
        // follow / unfollow — chỉ ghi dấu trạng thái vào kho theo zaloUserId
        if (body.action === "follow") {
            await db.collection(COLL_ZALO_USERS).doc(body.zaloUserId).set({
                followed: true,
                lastSeenAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                src: "webhook_follow",
            }, { merge: true });
            res.json({ ok: true, action: "followed" });
            return;
        }
        if (body.action === "unfollow") {
            await db.collection(COLL_ZALO_USERS).doc(body.zaloUserId).set({
                followed: false,
                updatedAt: FieldValue.serverTimestamp(),
                src: "webhook_unfollow",
            }, { merge: true });
            res.json({ ok: true, action: "unfollowed" });
            return;
        }
        // link — cần có zaloUserId & code
        if (body.action === "link") {
            const { zaloUserId, code } = body;
            if (!zaloUserId || !code) {
                res.status(400).json({ ok: false, error: "MISSING_PARAMS" });
                return;
            }
            // Lấy doc theo docId = code (chuẩn mình đã tạo)
            const codeRef = db.collection(COLL_LINK_CODES).doc(code);
            const codeSnap = await codeRef.get();
            if (!codeSnap.exists) {
                res.status(404).json({ ok: false, error: "CODE_NOT_FOUND" });
                return;
            }
            const data = codeSnap.data();
            if (data.used) {
                res.status(409).json({ ok: false, error: "CODE_USED" });
                return;
            }
            const expiresAtMs = Number(data.expiresAtMs ?? data.expiresAt ?? 0);
            if (!expiresAtMs || Date.now() > expiresAtMs) {
                res.status(410).json({ ok: false, error: "CODE_EXPIRED" });
                return;
            }
            const uid = data.uid;
            if (!uid) {
                res.status(500).json({ ok: false, error: "CODE_NO_UID" });
                return;
            }
            // 1) Ghi map vào userNotificationPreferences/{uid}
            await db.collection("userNotificationPreferences").doc(uid).set({
                contact: { zaloUserId },
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
            // 2) Ghi kho reverse zalo_oa_users/{zaloUserId}
            await db.collection(COLL_ZALO_USERS).doc(zaloUserId).set({
                uid,
                followed: true,
                lastSeenAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp(),
                src: "webhook_link",
            }, { merge: true });
            // 3) Đánh dấu code đã dùng
            await codeRef.set({
                used: true,
                usedAt: FieldValue.serverTimestamp(),
                usedByZaloUserId: zaloUserId,
            }, { merge: true });
            res.json({ ok: true, uid, zaloUserId, linked: true });
            return;
        }
        res.status(400).json({ ok: false, error: "UNHANDLED_ACTION" });
    }
    catch (e) {
        functions.logger.error("zaloIngest error", e);
        res.status(500).json({ ok: false, error: e?.message || String(e) });
    }
});
//# sourceMappingURL=zaloIngest.js.map