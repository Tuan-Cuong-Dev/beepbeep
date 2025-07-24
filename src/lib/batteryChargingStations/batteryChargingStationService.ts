import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BatteryChargingStation } from './batteryChargingStationTypes';

const colRef = collection(db, 'batteryChargingStations');

export const fetchBatteryChargingStations = async () => {
  const snap = await getDocs(colRef);
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BatteryChargingStation));
};

// ✅ Cập nhật kiểu dữ liệu đầy đủ cho các trường mở rộng
export const createBatteryChargingStation = async (
  data: Omit<
    BatteryChargingStation,
    'id' | 'createdAt' | 'updatedAt' | 'createdBy'
  >,
  createdBy: string
) => {
  const payload: Omit<BatteryChargingStation, 'id'> = {
    ...data,
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  return await addDoc(colRef, payload);
};

export const updateBatteryChargingStation = async (
  id: string,
  data: Partial<BatteryChargingStation>
) => {
  const ref = doc(db, 'batteryChargingStations', id);
  return await updateDoc(ref, {
    ...data,
    updatedAt: Timestamp.now(),
  });
};

export const deleteBatteryChargingStation = async (id: string) => {
  const ref = doc(db, 'batteryChargingStations', id);
  return await deleteDoc(ref);
};
