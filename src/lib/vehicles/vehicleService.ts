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
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';

export async function saveVehicle(bike: Vehicle, isUpdate: boolean): Promise<Vehicle[]> {
  const dataToSave = {
    ...bike,
    updatedAt: serverTimestamp(),
    createdAt: bike.createdAt || serverTimestamp(),
  };

  if (isUpdate && bike.id) {
    await updateDoc(doc(db, 'vehicles', bike.id), dataToSave);
  } else {
    const docRef = await addDoc(collection(db, 'vehicles'), { ...dataToSave, id: '' });
    await updateDoc(docRef, { id: docRef.id });
  }

  return fetchVehiclesByCompany(bike.companyId);
}

export async function fetchVehiclesByCompany(companyId: string): Promise<Vehicle[]> {
  const q = query(collection(db, 'vehicles'), where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Vehicle, 'id'>),
  }));
}

export async function deleteVehicle(id: string, companyId: string): Promise<Vehicle[]> {
  await deleteDoc(doc(db, 'vehicles', id));
  return fetchVehiclesByCompany(companyId);
}
