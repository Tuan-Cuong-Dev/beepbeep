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
    const parsed = JSON.parse(rawJson);
    if (parsed.private_key) parsed.private_key = String(parsed.private_key).replace(/\\n/g, "\n");
    initializeApp({ credential: cert(parsed) });
    __loadedVia = "json";
    return;
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

  // Không fallback ADC trên Vercel → fail-fast để lộ ra lỗi cấu hình
  console.error("[FIREBASE_ADMIN] Missing credentials env");
  throw new Error("MISSING_FIREBASE_ADMIN_CREDS");
}
initAdmin();

export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const db = adminDb;
export { FieldValue, Timestamp, GeoPoint };
export const __adminLoadedVia = __loadedVia;
