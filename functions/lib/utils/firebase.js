// functions/src/utils/firebase.ts
import * as admin from 'firebase-admin';
// Chỉ init 1 lần
if (admin.apps.length === 0) {
    admin.initializeApp();
}
export { admin };
export const db = admin.firestore();
