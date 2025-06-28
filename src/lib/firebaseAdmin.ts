import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) throw new Error('FIREBASE_ADMIN_CREDENTIALS is not set');

  const parsed = JSON.parse(raw);

  // Giải mã lại private_key nếu đang bị escape \\n → \n
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
  }

  initializeApp({
    credential: cert(parsed),
  });
}

export const adminAuth = getAuth();
export const adminDB = getFirestore();
