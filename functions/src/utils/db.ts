// functions/src/utils/db.ts
// Date 27/09


import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import admin from 'firebase-admin'; // chỉ để export nếu nơi khác cần admin

if (getApps().length === 0) initializeApp();

export const db = getFirestore();
// áp dụng cho TẤT CẢ thao tác Firestore trong Functions
db.settings({ ignoreUndefinedProperties: true });

export { FieldValue, Timestamp, admin };
