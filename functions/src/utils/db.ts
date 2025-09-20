// functions/src/utils/db.ts
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

initializeApp();
export const db = getFirestore();
export { FieldValue, Timestamp };

