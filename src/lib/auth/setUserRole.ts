// src/lib/auth/setUserRole.ts

import { admin } from '@/src/firebaseAdmin'; // import đúng từ file bạn đã viết

export async function setUserRole(uid: string, role: string) {
  await admin.auth().setCustomUserClaims(uid, { role });
}
