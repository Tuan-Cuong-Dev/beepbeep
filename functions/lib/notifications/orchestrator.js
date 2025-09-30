// functions/src/notifications/orchestrator.ts
import * as functions from "firebase-functions";
import { DateTime } from "luxon";
import { db, FieldValue } from "../utils/db.js";
const RUNTIME_REGION = "asia-southeast1";
const FUNCTIONS_BASE = process.env.FUNCTIONS_BASE_URL;
const INTERNAL_WORKER_SECRET = process.env.INTERNAL_WORKER_SECRET;
const MAX_PENDING = 50;
const PATH_BY_CHANNEL = {
    inapp: "sendInapp",
    push: "sendFcm", // push -> sendFcm
    zalo: "sendZalo",
    viber: "sendViber",
    email: "sendEmail",
    sms: "sendSms",
};
/* ========== Helpers ========== */
function renderTemplate(tplStr = "", data) {
    return tplStr.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => {
        const v = k.split(".").reduce((o, kk) => o?.[kk], data);
        return (v ?? "").toString();
    });
}
// Hỗ trợ cả string và object đa ngôn ngữ {vi,en,...}
function pickLocalized(v, lang) {
    if (typeof v === "string")
        return v;
    return v?.[lang] ?? v?.vi ?? v?.en ?? "";
}
function isQuietHours(pref) {
    const zone = pref?.timezone || "Asia/Ho_Chi_Minh";
    const nowHHmm = DateTime.now().setZone(zone).toFormat("HH:mm");
    const q = pref?.quietHours;
    if (!q?.start || !q?.end)
        return false;
    // ví dụ 22:00–07:00 (wrap qua nửa đêm)
    return q.start < q.end
        ? nowHHmm >= q.start && nowHHmm < q.end
        : nowHHmm >= q.start || nowHHmm < q.end;
}
async function callWorker(path, body) {
    if (!FUNCTIONS_BASE)
        throw new Error("FUNCTIONS_BASE_URL is not set");
    const res = await fetch(`${FUNCTIONS_BASE}/${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-internal-secret": INTERNAL_WORKER_SECRET,
        },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`${path} ${res.status} ${t}`);
    }
    return res.json().catch(() => ({}));
}
/* ========== Firestore onCreate: fan-out kênh ========== */
export const onNotificationJobCreate = functions
    .region(RUNTIME_REGION)
    .firestore.document("notificationJobs/{jobId}")
    .onCreate(async (snap, ctx) => {
    const jobId = ctx.params.jobId;
    const job = snap.data();
    // MVP: audience = 1 user
    const uids = job?.audience?.type === "user" ? [job.audience.uid] : [];
    if (uids.length === 0) {
        await snap.ref.update({
            status: "failed",
            error: "no_audience",
            finishedAt: FieldValue.serverTimestamp(),
        });
        return;
    }
    // Template
    const tplDoc = await db
        .collection("notificationTemplates")
        .doc(job.templateId)
        .get();
    if (!tplDoc.exists) {
        await snap.ref.update({
            status: "failed",
            error: "template_not_found",
            finishedAt: FieldValue.serverTimestamp(),
        });
        return;
    }
    const tpl = tplDoc.data();
    await snap.ref.update({
        status: "processing",
        startedAt: FieldValue.serverTimestamp(),
    });
    for (const uid of uids) {
        const prefDoc = await db
            .collection("userNotificationPreferences")
            .doc(uid)
            .get();
        if (!prefDoc.exists) {
            functions.logger.warn("pref_missing", { uid, jobId });
            continue;
        }
        const pref = prefDoc.data();
        // Render payload (string hoặc đa ngôn ngữ)
        const lang = pref.language ?? "vi";
        const payload = {
            title: renderTemplate(pickLocalized(tpl.title, lang), job.data),
            body: renderTemplate(pickLocalized(tpl.body, lang), job.data),
            actionUrl: job.data?.actionUrl,
        };
        // Chọn kênh
        const channels = job.requiredChannels || tpl.channels || ["inapp", "push"];
        // Quiet hours?
        const inQuiet = isQuietHours(pref);
        // In-app luôn (không tạo pending)
        if (channels.includes("inapp")) {
            await callWorker("sendInapp", {
                jobId,
                uid,
                payload,
                topic: job.topic,
            }).catch((e) => functions.logger.error("sendInapp error", {
                jobId,
                uid,
                e: String(e),
            }));
        }
        // Các kênh còn lại
        for (const ch of channels.filter((c) => c !== "inapp")) {
            const deliveryId = `${jobId}_${ch}_${uid}`;
            if (inQuiet) {
                await db
                    .collection("deliveries")
                    .doc(deliveryId)
                    .set({
                    id: deliveryId,
                    jobId,
                    uid,
                    channel: ch,
                    status: "pending",
                    createdAt: FieldValue.serverTimestamp(),
                }, { merge: true });
                continue;
            }
            // Build target từ user pref
            const target = {
                push: { tokens: pref.contact?.fcmTokens || [] },
                zalo: { zaloUserId: pref.contact?.zaloUserId },
                viber: { viberUserId: pref.contact?.viberUserId },
                email: { to: pref.contact?.email },
                sms: { to: pref.contact?.phone },
            }[ch] ?? {};
            const path = PATH_BY_CHANNEL[ch];
            await callWorker(path, { jobId, uid, payload, target }).catch((e) => functions.logger.error(`worker ${path} error`, {
                jobId,
                uid,
                ch,
                e: String(e),
            }));
        }
    }
    await snap.ref.update({
        status: "processing_done",
        finishedAt: FieldValue.serverTimestamp(),
    });
});
/* ========== Scheduler: gỡ deliveries pending sau quiet hours ========== */
export const processNotificationJobs = functions
    .region(RUNTIME_REGION)
    .pubsub.schedule("every 1 minutes")
    .timeZone("Asia/Ho_Chi_Minh")
    .onRun(async () => {
    const snap = await db
        .collection("deliveries")
        .where("status", "==", "pending")
        .limit(MAX_PENDING)
        .get();
    if (snap.empty)
        return;
    for (const doc of snap.docs) {
        try {
            const d = doc.data();
            if (!d?.jobId || !d?.channel || !d?.uid) {
                await doc.ref.set({
                    status: "failed",
                    error: "missing_fields",
                    finishedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
                continue;
            }
            // Không xử lý inapp ở pending (inapp đã gửi ngay từ onCreate)
            if (d.channel === "inapp") {
                await doc.ref.set({
                    status: "skipped",
                    error: "inapp_has_no_pending",
                    finishedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
                continue;
            }
            // Load job + pref + template
            const [jobSnap, prefSnap] = await Promise.all([
                db.collection("notificationJobs").doc(d.jobId).get(),
                db.collection("userNotificationPreferences").doc(d.uid).get(),
            ]);
            if (!jobSnap.exists) {
                await doc.ref.set({
                    status: "failed",
                    error: "job_not_found",
                    finishedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
                continue;
            }
            const job = jobSnap.data();
            const tplSnap = await db
                .collection("notificationTemplates")
                .doc(job.templateId)
                .get();
            if (!tplSnap.exists) {
                await doc.ref.set({
                    status: "failed",
                    error: "template_not_found",
                    finishedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
                continue;
            }
            const tpl = tplSnap.data();
            if (!prefSnap.exists) {
                await doc.ref.set({
                    status: "failed",
                    error: "pref_not_found",
                    finishedAt: FieldValue.serverTimestamp(),
                }, { merge: true });
                continue;
            }
            const pref = prefSnap.data();
            // Nếu vẫn trong quiet hours → để pending tiếp
            if (isQuietHours(pref))
                continue;
            // Render payload (string hoặc đa ngôn ngữ)
            const lang = pref.language ?? "vi";
            const payload = {
                title: renderTemplate(pickLocalized(tpl.title, lang), job.data),
                body: renderTemplate(pickLocalized(tpl.body, lang), job.data),
                actionUrl: job.data?.actionUrl,
            };
            // Build target đủ key (TS happy)
            const targetMap = {
                inapp: undefined,
                push: { tokens: pref.contact?.fcmTokens || [] },
                zalo: { zaloUserId: pref.contact?.zaloUserId },
                viber: { viberUserId: pref.contact?.viberUserId },
                email: { to: pref.contact?.email },
                sms: { to: pref.contact?.phone },
            };
            const target = targetMap[d.channel] ?? {};
            const path = PATH_BY_CHANNEL[d.channel];
            // Gọi worker; worker sẽ tự ghi cùng docId (delivId) bên trong
            await callWorker(path, { jobId: d.jobId, uid: d.uid, payload, target });
            // Ghi dấu resume (merge, tránh đè nội dung worker đã set)
            await doc.ref.set({ resumedAt: FieldValue.serverTimestamp() }, { merge: true });
        }
        catch (err) {
            await doc.ref.set({
                status: "failed",
                error: String(err),
                finishedAt: FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    }
});
//# sourceMappingURL=orchestrator.js.map