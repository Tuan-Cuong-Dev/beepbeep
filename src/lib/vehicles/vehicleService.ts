import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  getDocs,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Ebike } from '@/src/lib/vehicles/vehicleTypes';

export async function saveEbike(bike: Ebike, isUpdate: boolean): Promise<Ebike[]> {
  const dataToSave = {
    ...bike,
    updatedAt: serverTimestamp(),
    createdAt: bike.createdAt || serverTimestamp(),
  };

  if (isUpdate && bike.id) {
    await updateDoc(doc(db, 'ebikes', bike.id), dataToSave);
  } else {
    const docRef = await addDoc(collection(db, 'ebikes'), { ...dataToSave, id: '' });
    await updateDoc(docRef, { id: docRef.id });
  }

  return fetchEbikesByCompany(bike.companyId);
}

export async function fetchEbikesByCompany(companyId: string): Promise<Ebike[]> {
  const q = query(collection(db, 'ebikes'), where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Ebike, 'id'>),
  }));
}

export async function deleteEbike(id: string, companyId: string): Promise<Ebike[]> {
  await deleteDoc(doc(db, 'ebikes', id));
  return fetchEbikesByCompany(companyId);
}
