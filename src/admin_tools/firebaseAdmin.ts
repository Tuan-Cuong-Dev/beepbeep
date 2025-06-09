import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { ServiceAccount } from 'firebase-admin';

// ✅ ESM-compatible import
import serviceAccountJson from './serviceAccountKey.json' assert { type: 'json' };

// ✅ ép kiểu cho đúng interface ServiceAccount
const serviceAccount = serviceAccountJson as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount),
});

export const adminDb = getFirestore();
