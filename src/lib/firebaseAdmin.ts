// src/lib/firebaseAdmin.ts
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp, GeoPoint } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let __loadedVia: "json" | "triplet" | null = null;

function initAdmin() {
  if (getApps().length) return;

  const rawJson = process.env.FIREBASE_ADMIN_CREDENTIALS;
  const pid = process.env.FIREBASE_PROJECT_ID;
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const key = process.env.FIREBASE_PRIVATE_KEY;

  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson);
      if (parsed.private_key) parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
      initializeApp({ credential: cert(parsed) });
      __loadedVia = "json";
      return;
    } catch (e) {
      console.error("[FIREBASE_ADMIN] Invalid FIREBASE_ADMIN_CREDENTIALS JSON");
      throw e;
    }
  }

  if (pid && email && key) {
    initializeApp({
      credential: cert({
        projectId: pid,
        clientEmail: email,
        privateKey: key.replace(/\\n/g, "\n"),
      }),
    });
    __loadedVia = "triplet";
    return;
  }

  console.error("[FIREBASE_ADMIN] Missing credentials env. Need FIREBASE_ADMIN_CREDENTIALS or PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY.");
  throw new Error("MISSING_FIREBASE_ADMIN_CREDS");
}

initAdmin();

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Back-compat
export const db = adminDb;
export { FieldValue, Timestamp, GeoPoint };

// expose để route debug có thể cho biết đang dùng nguồn nào (không lộ secret)
export const __adminLoadedVia = __loadedVia;
