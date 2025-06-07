// src/lib/ebikes/deleteEbikesByCompany.ts

'use server';

import { db } from '@/src/firebaseConfig';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

// ❗ Xóa tất cả ebikes của 1 company (Company Owner, Staff dùng)
export async function deleteAllEbikesByCompany(companyId: string) {
  if (!companyId) throw new Error('Missing companyId');

  const q = query(collection(db, 'ebikes'), where('companyId', '==', companyId));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'ebikes', docSnap.id)));
  await Promise.all(deletePromises);

  return snapshot.docs.length; // 👉 trả về số lượng xe đã xóa
}

// ❗ Xóa tất cả ebikes toàn hệ thống (Admin dùng)
export async function deleteAllEbikes() {
  const snapshot = await getDocs(collection(db, 'ebikes'));

  const deletePromises = snapshot.docs.map(docSnap => deleteDoc(doc(db, 'ebikes', docSnap.id)));
  await Promise.all(deletePromises);

  return snapshot.docs.length; // 👉 trả về số lượng xe đã xóa
}
