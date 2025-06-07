import { db } from '@/src/firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompanyTypes';

/**
 * Tạo mới một rental company
 */
export async function createRentalCompany(data: Omit<RentalCompany, 'id' | 'createdAt' | 'updatedAt'>) {
  const docRef = await addDoc(collection(db, 'rentalCompanies'), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

/**
 * Cập nhật thông tin một rental company
 */
export async function updateRentalCompany(id: string, data: Omit<RentalCompany, 'id'>) {
  await updateDoc(doc(db, 'rentalCompanies', id), {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Lấy công ty theo ownerId (dành cho người dùng hiện tại)
 */
export async function getMyRentalCompany(ownerId: string): Promise<RentalCompany | null> {
  const q = query(collection(db, 'rentalCompanies'), where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as RentalCompany;
}
