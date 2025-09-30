// functions/src/notification/zalo/createZaloLinkCode.ts
import * as functions from "firebase-functions";
import { db, FieldValue } from "../../utils/db.js";

const REGION = "asia-southeast1";

function genCode(len = 6) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export const createZaloLinkCode = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in");
    }

    const ttlMinutes = Number(data?.ttlMinutes ?? 10);
    const length = Number(data?.length ?? 6);

    const now = Date.now();
    const expiresAtMs = now + ttlMinutes * 60_000;

    // Luôn tạo code mới (đơn giản, tránh phụ thuộc composite index)
    const code = genCode(length);
    const docRef = db.collection("zalo_link_codes").doc(code);

    await docRef.set({
      code,
      uid,
      used: false,
      createdAt: FieldValue.serverTimestamp(),
      expiresAtMs,
      // Thêm field song song để client cũ/new đều đọc được
      expiresAt: expiresAtMs,
    });

    return { code, expiresAtMs };
  });
