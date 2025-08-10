'use server';

import { db } from '@/src/firebaseConfig';
import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';

// ✅ Xác định role nào được phép xóa theo companyId
const canDeleteByCompany = (role: string) =>
  ['company_owner', 'company_admin'].includes(role.toLowerCase());

/**
 * ❗ Xóa tất cả vehicles của một công ty (dành cho Company Owner, Company Admin)
 * @param companyId - ID của công ty
 * @param role - Vai trò của người dùng gọi hàm
 */
export async function deleteAllvehiclesByCompany(companyId: string, role: string) {
  if (!companyId) throw new Error('Missing companyId');
  if (!canDeleteByCompany(role)) throw new Error('Permission denied');

  const q = query(collection(db, 'vehicles'), where('companyId', '==', companyId));
  const snapshot = await getDocs(q);

  const deletePromises = snapshot.docs.map(docSnap =>
    deleteDoc(doc(db, 'vehicles', docSnap.id))
  );
  await Promise.all(deletePromises);

  return snapshot.docs.length; // 👉 Trả về số lượng xe đã xóa
}

/**
 * ❗ Xóa tất cả vehicles trong toàn bộ hệ thống (chỉ Admin dùng)
 */
export async function deleteAllvehicles(role: string) {
  if (role.toLowerCase() !== 'admin') throw new Error('Only admin can delete all vehicles');

  const snapshot = await getDocs(collection(db, 'vehicles'));

  const deletePromises = snapshot.docs.map(docSnap =>
    deleteDoc(doc(db, 'vehicles', docSnap.id))
  );
  await Promise.all(deletePromises);

  return snapshot.docs.length;
}
