import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp, GeoPoint } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function initAdmin() {
  if (getApps().length) return;

  const pid = process.env.FIREBASE_PROJECT_ID;
  const email = process.env.FIREBASE_CLIENT_EMAIL;
  const key = process.env.FIREBASE_PRIVATE_KEY;

  if (pid && email && key) {
    initializeApp({
      credential: cert({
        projectId: pid,
        clientEmail: email,
        privateKey: key.replace(/\\n/g, "\n"),
      }),
    });
    return;
  }
  console.error("[FIREBASE_ADMIN] Missing credentials env");
  throw new Error("MISSING_FIREBASE_ADMIN_CREDS");
}
initAdmin();

export const db = getFirestore();
export const adminAuth = getAuth();
export { FieldValue, Timestamp, GeoPoint };
