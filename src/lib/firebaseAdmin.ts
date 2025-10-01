// src/lib/firebaseAdmin.ts
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp, GeoPoint } from 'firebase-admin/firestore';

function initAdmin() {
  if (getApps().length) return;

  // Option A: nguyên chuỗi JSON trong FIREBASE_ADMIN_CREDENTIALS
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (raw) {
    const parsed = JSON.parse(raw);
    if (parsed.private_key) parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    initializeApp({ credential: cert(parsed) });
    return;
  }

  // Option B: 3 biến rời
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    initializeApp({
      credential: cert({
        projectId: FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    return;
  }

  // Option C: ADC (GOOGLE_APPLICATION_CREDENTIALS, GCE/GCP metadata, v.v.)
  try {
    initializeApp({ credential: applicationDefault() });
  } catch (err) {
    throw new Error(
      'Firebase Admin not initialized. Provide FIREBASE_ADMIN_CREDENTIALS (JSON) ' +
      'hoặc bộ 3 biến FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY, ' +
      'hoặc cấu hình GOOGLE_APPLICATION_CREDENTIALS.'
    );
  }
}
initAdmin();

export const adminAuth = getAuth();
export const adminDb = getFirestore();

// Back-compat (nếu code cũ đang dùng "db" hoặc FieldValue kiểu namespace)
export const db = adminDb;
export { FieldValue, Timestamp, GeoPoint };
