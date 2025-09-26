// functions/src/utils/db.ts
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
if (getApps().length === 0) {
    initializeApp();
}
export const db = getFirestore();
// ✅ Quan trọng: bỏ qua mọi giá trị `undefined` khi ghi vào Firestore
db.settings({ ignoreUndefinedProperties: true });
export { FieldValue, Timestamp };
