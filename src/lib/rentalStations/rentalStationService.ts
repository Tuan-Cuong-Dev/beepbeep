// lib/rentalStations/rentalStationService.ts
// date : 15/09/2025

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
  getDoc,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type {
  RentalStation,
  RentalStationFormValues,
  StationStatus,
  VehicleType,
} from './rentalStationTypes';

const colRef = collection(db, 'rentalStations');

/* ========== Helpers ========== */
const docToStation = (d: any): RentalStation => {
  const data = d.data();
  return { id: d.id, ...(data || {}) } as RentalStation;
};
const snapshotToStation = (snap: any): RentalStation => {
  if (!snap.exists()) throw new Error('RentalStation not found');
  const data = snap.data();
  return { id: snap.id, ...(data || {}) } as RentalStation;
};

/* ========== Fetch (overloads) ========== */

type FetchOptions = {
  companyId?: string;
  isAdmin?: boolean;
  status?: StationStatus;
  vehicleType?: VehicleType;
};

// overload 1: chữ ký cũ
export function fetchRentalStations(companyId: string, isAdmin?: boolean): Promise<RentalStation[]>;
// overload 2: chữ ký mới với options
export function fetchRentalStations(opts: FetchOptions): Promise<RentalStation[]>;
// triển khai chung
export async function fetchRentalStations(
  arg1: string | FetchOptions,
  isAdminFlag: boolean = false
): Promise<RentalStation[]> {
  // chuẩn hoá về options
  const opts: FetchOptions =
    typeof arg1 === 'string'
      ? { companyId: arg1, isAdmin: isAdminFlag }
      : arg1 ?? {};

  const constraints: QueryConstraint[] = [];
  // nếu không phải admin → cần companyId để lọc
  if (!opts.isAdmin && opts.companyId) {
    constraints.push(where('companyId', '==', opts.companyId));
  }

  const qRef = constraints.length ? query(colRef, ...constraints) : colRef;
  const snap = await getDocs(qRef);
  let data = snap.docs.map(docToStation);

  // lọc client-side thêm (tránh yêu cầu composite index ngay)
  if (opts.status) {
    data = data.filter((s) => s.status === opts.status);
  }
  if (opts.vehicleType) {
    data = data.filter((s) => s.vehicleType === opts.vehicleType);
  }
  return data;
}

/* ========== Create ========== */
export const createRentalStation = async (
  form: RentalStationFormValues & { companyId: string },
  createdBy: string
): Promise<RentalStation> => {
  const payload = {
    ...form,
    status: form.status ?? 'active',
    createdBy,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  const ref = await addDoc(colRef, payload);
  return { id: ref.id, ...payload } as RentalStation;
};

/* ========== Update ========== */
export const updateRentalStation = async (
  id: string,
  data: Partial<RentalStation>
): Promise<RentalStation> => {
  const ref = doc(db, 'rentalStations', id);
  await updateDoc(ref, { ...data, updatedAt: Timestamp.now() });
  const snap = await getDoc(ref);
  return snapshotToStation(snap);
};

/* ========== Delete ========== */
export const deleteRentalStation = async (id: string) => {
  const ref = doc(db, 'rentalStations', id);
  await deleteDoc(ref);
};
