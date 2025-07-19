// 📁 lib/batteryStations/batteryStationService.ts
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
import { BatteryStation } from './batteryStationTypes';

const colRef = collection(db, 'batteryStations');

export const fetchBatteryStations = async () => {
  const snap = await getDocs(colRef);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BatteryStation));
};

export const createBatteryStation = async (
  data: Omit<BatteryStation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
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


export const updateBatteryStation = async (id: string, data: Partial<BatteryStation>) => {
  const ref = doc(db, 'batteryStations', id);
  return await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteBatteryStation = async (id: string) => {
  const ref = doc(db, 'batteryStations', id);
  return await deleteDoc(ref);
};