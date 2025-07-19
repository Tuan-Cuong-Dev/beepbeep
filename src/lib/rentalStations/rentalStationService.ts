import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { RentalStation } from './rentalStationTypes';

const colRef = collection(db, 'rentalStations');

export const fetchRentalStations = async (companyId: string, isAdmin = false) => {
  let q;
  if (isAdmin) {
    q = colRef;
  } else {
    q = query(colRef, where('companyId', '==', companyId));
  }

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as RentalStation));
};

export const createRentalStation = async (
  data: Omit<RentalStation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
  createdBy: string
) => {
  const payload = {
    ...data,
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  return await addDoc(colRef, payload);
};

export const updateRentalStation = async (id: string, data: Partial<RentalStation>) => {
  const ref = doc(db, 'rentalStations', id);
  return await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteRentalStation = async (id: string) => {
  const ref = doc(db, 'rentalStations', id);
  return await deleteDoc(ref);
};
