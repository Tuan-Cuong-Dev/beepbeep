// functions/src/notification/zalo/createZaloLinkCode.ts
import * as functions from "firebase-functions";
import { db, FieldValue } from "../../utils/db.js";

const REGION = "asia-southeast1";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // bỏ I, L, O, 0, 1

function genCode(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/** Tạo mã không trùng docId (thử tối đa maxTry lần) */
async function newUniqueCode(length: number, maxTry = 6): Promise<string> {
  for (let i = 0; i < maxTry; i++) {
    const code = genCode(length);
    const ref = db.collection("zalo_link_codes").doc(code);
    const snap = await ref.get();
    if (!snap.exists) return code;
  }
  throw new functions.https.HttpsError(
    "internal",
    "FAILED_TO_GENERATE_UNIQUE_CODE"
  );
}

export const createZaloLinkCode = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in"
      );
    }

    // Giới hạn an toàn để tránh lạm dụng
    const ttlMinutesInput = Number(data?.ttlMinutes ?? 10);
    const lengthInput = Number(data?.length ?? 6);
    const ttlMinutes = Math.min(Math.max(ttlMinutesInput, 1), 30); // 1..30 phút
    const length = Math.min(Math.max(lengthInput, 4), 12);         // 4..12 ký tự

    const nowMs = Date.now();
    const expiresAtMs = nowMs + ttlMinutes * 60_000;

    // Tạo mã duy nhất (docID = code) để không cần index khi tra cứu
    const code = await newUniqueCode(length);
    const ref = db.collection("zalo_link_codes").doc(code);

    // Lưu song song:
    // - expiresAtMs: number (dùng trong code hiện tại)
    // - expiresAtTs: Timestamp (bật TTL cleanup trong Firestore dễ dàng)
    await ref.set({
      code,
      uid,
      used: false,
      linkedZaloUserId: null,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: nowMs,
      expiresAtMs,
      expiresAt: expiresAtMs, // giữ tương thích ngược nếu client cũ đọc field này
      expiresAtTs: new Date(expiresAtMs), // để cấu hình TTL của Firestore (khuyến nghị)
      ttlMinutes,
      v: 2,
      // thêm chút metadata hữu ích khi debug
      meta: {
        callable: true,
        userAgent: (context.rawRequest as any)?.headers?.["user-agent"] || null,
        ip: (context.rawRequest as any)?.headers?.["x-forwarded-for"] || null,
      },
    });

    return { code, expiresAtMs, ttlMinutes };
  });
