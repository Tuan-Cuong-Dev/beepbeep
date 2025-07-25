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

// 📌 Lấy danh sách tất cả trạm sạc
export const fetchBatteryChargingStations = async (): Promise<BatteryChargingStation[]> => {
  const snap = await getDocs(colRef);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  } as BatteryChargingStation));
};

// 📌 Tạo mới trạm sạc
export const createBatteryChargingStation = async (
  data: Omit<BatteryChargingStation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>,
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

// 📌 Cập nhật trạm sạc
export const updateBatteryChargingStation = async (
  id: string,
  data: Partial<BatteryChargingStation>
) => {
  const ref = doc(db, 'batteryChargingStations', id);
  const payload = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  return await updateDoc(ref, payload);
};

// 📌 Xoá trạm sạc
export const deleteBatteryChargingStation = async (id: string) => {
  const ref = doc(db, 'batteryChargingStations', id);
  return await deleteDoc(ref);
};
