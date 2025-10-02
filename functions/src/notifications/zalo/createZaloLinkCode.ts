import * as functions from "firebase-functions";
import { db, FieldValue } from "../../utils/db.js";

const REGION = "asia-southeast1";
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function genCode(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
}

async function newUniqueCode(length: number, maxTry = 6): Promise<string> {
  for (let i = 0; i < maxTry; i++) {
    const code = genCode(length);
    const ref = db.collection("zalo_link_codes").doc(code);
    const snap = await ref.get();
    if (!snap.exists) return code;
  }
  throw new functions.https.HttpsError("internal", "FAILED_TO_GENERATE_UNIQUE_CODE");
}

export const createZaloLinkCode = functions
  .region(REGION)
  .https.onCall(async (data, context) => {
    const uid = context.auth?.uid;
    if (!uid) throw new functions.https.HttpsError("unauthenticated", "Must be signed in");

    const ttlMinutes = Math.min(Math.max(Number(data?.ttlMinutes ?? 10), 1), 30);
    const length     = Math.min(Math.max(Number(data?.length ?? 6), 4), 12);

    const nowMs = Date.now();
    const expiresAtMs = nowMs + ttlMinutes * 60_000;

    const code = await newUniqueCode(length);
    const ref  = db.collection("zalo_link_codes").doc(code);

    await ref.set({
      code, uid, used: false,
      createdAt: FieldValue.serverTimestamp(),
      createdAtMs: nowMs,
      expiresAtMs,
      expiresAt: expiresAtMs,              // tương thích client cũ
      expiresAtTs: new Date(expiresAtMs),  // dùng cho TTL
      ttlMinutes, v: 2,
    });

    return { code, expiresAtMs, ttlMinutes };
  });
