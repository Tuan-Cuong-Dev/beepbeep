// Lấy và xữ lý dữ liệu bookings
// 10/09/2025

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  where,
  Query,
  DocumentData,
  documentId,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Booking } from '@/src/lib/booking/BookingTypes';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';

type EntityType = 'rentalCompany' | 'privateProvider' | 'agent';

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr.filter(Boolean))) as T[];
}
function chunk<T>(arr: T[], size = 10): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export function useBookingData(
  ownerId: string,
  entityType: EntityType,
  filters?: { startDate?: string; endDate?: string }
) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stationNames, setStationNames] = useState<Record<string, string>>({});
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [packageNames, setPackageNames] = useState<Record<string, string>>({});
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Field nhận diện chủ sở hữu tuỳ entity (agent → userId)
  const ownerField = useMemo(
    () =>
      entityType === 'privateProvider'
        ? 'providerId'
        : entityType === 'agent'
        ? 'userId'
        : 'companyId',
    [entityType]
  );

  useEffect(() => {
    if (!ownerId) return;
    fetchAllData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, entityType, JSON.stringify(filters)]);

  const toTimestamp = (val: any): Timestamp => {
    if (val instanceof Timestamp) return val;
    if (val?.toDate) return Timestamp.fromDate(val.toDate());
    if (val instanceof Date) return Timestamp.fromDate(val);
    if (typeof val === 'string' || typeof val === 'number')
      return Timestamp.fromDate(new Date(val));
    return Timestamp.now();
  };

  const fetchAllData = async (fs?: { startDate?: string; endDate?: string }) => {
    setLoading(true);
    try {
      if (entityType === 'agent') {
        // 1) Lấy bookings của agent
        const list = await fetchBookings(fs);
        // 2) Từ bookings → gom id để lấy meta theo nhu cầu
        const stationIds = uniq(list.map((b) => b.stationId));
        const companyIds = uniq(list.map((b) => b.companyId));
        const packageIds = uniq(list.map((b) => b.package || '').filter(Boolean));
        const userIds = uniq(list.map((b) => b.userId || '').filter(Boolean));

        await Promise.all([
          fetchStationsByIds(stationIds),
          fetchCompaniesByIds(companyIds),
          fetchPackagesNameMapByIds(packageIds),
          fetchUsersByIds(userIds),
          // Agent không cần full vehicles/packages list theo owner → bỏ qua để nhẹ
        ]);
      } else {
        await Promise.all([
          fetchBookings(fs),
          fetchStationsByOwner(),
          fetchCompaniesByOwner(),
          fetchPackagesNameMapByOwner(),
          fetchUsersAllSafe(),
          fetchPackageListByOwner(),
          fetchVehicleListByOwner(),
        ]);
      }
    } catch (error) {
      console.error('❌ Error loading booking-related data:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ================== BOOKINGS ================== */
  const fetchBookings = async (fs?: { startDate?: string; endDate?: string }) => {
    const bookingRef = collection(db, 'bookings');

    const conditions: any[] = [where(ownerField, '==', ownerId)];
    if (fs?.startDate) {
      conditions.push(
        where('createdAt', '>=', Timestamp.fromDate(new Date(fs.startDate + 'T00:00:00')))
      );
    }
    if (fs?.endDate) {
      conditions.push(
        where('createdAt', '<=', Timestamp.fromDate(new Date(fs.endDate + 'T23:59:59')))
      );
    }

    const bookingQuery: Query<DocumentData> = query(bookingRef, ...conditions);
    const snap = await getDocs(bookingQuery);

    const list: Booking[] = snap.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        companyId: String(data.companyId ?? ''),
        stationId: String(data.stationId ?? ''),
        userId: data.userId ? String(data.userId) : undefined,

        idImage: data.idImage ? String(data.idImage) : undefined,
        fullName: String(data.fullName ?? ''),
        channel: data.channel ? String(data.channel) : undefined,
        phone: String(data.phone ?? ''),
        idNumber: String(data.idNumber ?? ''),
        address: String(data.address ?? ''),

        vehicleSearch: data.vehicleSearch ? String(data.vehicleSearch) : undefined,
        vehicleModel: String(data.vehicleModel ?? ''),
        vehicleColor: String(data.vehicleColor ?? ''),
        vin: String(data.vin ?? ''),
        licensePlate: data.licensePlate ? String(data.licensePlate) : undefined,

        batteryCode1: data.batteryCode1 ? String(data.batteryCode1) : undefined,
        batteryCode2: data.batteryCode2 ? String(data.batteryCode2) : undefined,
        batteryCode3: data.batteryCode3 ? String(data.batteryCode3) : undefined,
        batteryCode4: data.batteryCode4 ? String(data.batteryCode4) : undefined,

        rentalStartDate: toTimestamp(data.rentalStartDate),
        rentalStartHour: String(data.rentalStartHour ?? '08:00'),
        rentalDays: Number(data.rentalDays ?? 1),
        rentalEndDate: toTimestamp(data.rentalEndDate),

        package: data.package ? String(data.package) : undefined,
        basePrice: Number(data.basePrice ?? 0),
        batteryFee: data.batteryFee ? Number(data.batteryFee) : undefined,
        totalAmount: Number(data.totalAmount ?? 0),
        deposit: Number(data.deposit ?? 0),
        remainingBalance: Number(data.remainingBalance ?? 0),

        deliveryMethod:
          data.deliveryMethod === 'Deliver to Address' ? 'Deliver to Address' : 'Pickup at Shop',
        deliveryAddress: data.deliveryAddress ? String(data.deliveryAddress) : undefined,

        helmet: Boolean(data.helmet ?? false),
        charger: Boolean(data.charger ?? false),
        phoneHolder: Boolean(data.phoneHolder ?? false),
        rearRack: Boolean(data.rearRack ?? false),
        raincoat: Boolean(data.raincoat ?? false),
        note: data.note ? String(data.note) : undefined,

        bookingStatus:
          (data.bookingStatus as 'draft' | 'confirmed' | 'returned' | 'completed' | 'cancelled') ??
          'draft',
        statusComment: data.statusComment ?? '',
        createdAt: toTimestamp(data.createdAt),
        updatedAt: toTimestamp(data.updatedAt),
      };
    });

    setBookings(list);
    return list;
  };

  /* ================== STATIONS ================== */
  const fetchStationsByOwner = async () => {
    const col = collection(db, 'rentalStations');
    const qy = query(col, where(ownerField, '==', ownerId));
    const snap = await getDocs(qy);
    const map: Record<string, string> = {};
    snap.docs.forEach((d) => (map[d.id] = (d.data() as any).name || 'Unnamed Station'));
    setStationNames(map);
  };

  const fetchStationsByIds = async (ids: string[]) => {
    if (!ids.length) return setStationNames({});
    const map: Record<string, string> = {};
    for (const part of chunk(ids, 10)) {
      const snap = await getDocs(
        query(collection(db, 'rentalStations'), where(documentId(), 'in', part))
      );
      snap.docs.forEach((d) => (map[d.id] = (d.data() as any).name || d.id));
    }
    setStationNames(map);
  };

  /* ================== COMPANIES / PROVIDERS ================== */
  const fetchCompaniesByOwner = async () => {
    // tái sử dụng companyNames cho cả company hoặc provider tuỳ entity
    const colName = entityType === 'privateProvider' ? 'privateProviders' : 'rentalCompanies';
    const snap = await getDocs(collection(db, colName));
    const map: Record<string, string> = {};
    snap.docs.forEach((d) => (map[d.id] = (d.data() as any).name || d.id));
    setCompanyNames(map);
  };

  const fetchCompaniesByIds = async (ids: string[]) => {
    if (!ids.length) return setCompanyNames({});
    const map: Record<string, string> = {};
    for (const part of chunk(ids, 10)) {
      // rentalCompanies
      const s1 = await getDocs(
        query(collection(db, 'rentalCompanies'), where(documentId(), 'in', part))
      );
      s1.docs.forEach((d) => (map[d.id] = (d.data() as any).name || d.id));
      // privateProviders (đề phòng booking ghi providerId vào companyId)
      const s2 = await getDocs(
        query(collection(db, 'privateProviders'), where(documentId(), 'in', part))
      );
      s2.docs.forEach((d) => (map[d.id] = (d.data() as any).name || map[d.id] || d.id));
    }
    setCompanyNames(map);
  };

  /* ================== PACKAGES ================== */
  const fetchPackagesNameMapByOwner = async () => {
    const col = collection(db, 'subscriptionPackages');
    const snap = await getDocs(query(col, where(ownerField, '==', ownerId)));
    const map: Record<string, string> = {};
    snap.docs.forEach((d) => (map[d.id] = (d.data() as any).name || 'Unnamed Package'));
    setPackageNames(map);
  };

  const fetchPackagesNameMapByIds = async (ids: string[]) => {
    if (!ids.length) return setPackageNames({});
    const map: Record<string, string> = {};
    for (const part of chunk(ids, 10)) {
      const snap = await getDocs(
        query(collection(db, 'subscriptionPackages'), where(documentId(), 'in', part))
      );
      snap.docs.forEach((d) => (map[d.id] = (d.data() as any).name || d.id));
    }
    setPackageNames(map);
  };

  const fetchPackageListByOwner = async () => {
    const snap = await getDocs(
      query(collection(db, 'subscriptionPackages'), where(ownerField, '==', ownerId))
    );
    const list: SubscriptionPackage[] = snap.docs.map((d) => ({
      ...(d.data() as SubscriptionPackage),
      id: d.id,                           // 👈 đặt id ở CUỐI
    }));
    setPackages(list);
  };

  /* ================== USERS ================== */
  const fetchUsersAllSafe = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const map: Record<string, string> = {};
      snap.docs.forEach((d) => (map[d.id] = (d.data() as any).name || d.id));
      setUserNames(map);
    } catch {
      console.warn('⚠️ Cannot read users (rules may block).');
      setUserNames({});
    }
  };

  const fetchUsersByIds = async (ids: string[]) => {
    if (!ids.length) return setUserNames({});
    try {
      const map: Record<string, string> = {};
      for (const part of chunk(ids, 10)) {
        const snap = await getDocs(query(collection(db, 'users'), where(documentId(), 'in', part)));
        snap.docs.forEach((d) => (map[d.id] = (d.data() as any).name || d.id));
      }
      setUserNames(map);
    } catch {
      console.warn('⚠️ Cannot read users subset (rules may block).');
      setUserNames({});
    }
  };

  /* ================== VEHICLES ================== */
  const fetchVehicleListByOwner = async () => {
      const snap = await getDocs(
        query(collection(db, 'vehicles'), where(ownerField, '==', ownerId))
      );
      const list: Vehicle[] = snap.docs.map((d) => ({
        ...(d.data() as Vehicle),
        id: d.id,                           // 👈 đặt id ở CUỐI
      }));
      setVehicles(list);
    };

  /* ================== CREATE / UPDATE / DELETE ================== */
  const saveBooking = async (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingBooking) {
        const bookingRef = doc(db, 'bookings', editingBooking.id);

        // Giữ entity cũ nếu tồn tại, mặc định theo hook hiện tại
        const persistedEntityType: EntityType =
          ((editingBooking as any).entityType as EntityType) ?? entityType;

        const payload: any = {
          ...data,
          entityType: persistedEntityType,
          updatedAt: serverTimestamp(),
        };

        if (persistedEntityType === 'rentalCompany') {
          payload.companyId =
            (editingBooking as any).companyId || (data as any).companyId || ownerId;
          delete payload.providerId;
        } else if (persistedEntityType === 'privateProvider') {
          payload.providerId =
            (editingBooking as any).providerId || (data as any).providerId || ownerId;
          delete payload.companyId;
        } else {
          // agent → đảm bảo userId
          payload.userId = (data as any).userId || (editingBooking as any).userId || ownerId;
        }

        await updateDoc(bookingRef, payload);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === editingBooking.id
              ? ({ ...b, ...payload, updatedAt: Timestamp.now() } as Booking)
              : b
          )
        );
        setEditingBooking(null);
      } else {
        const payload: any = {
          ...data,
          entityType,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        if (entityType === 'rentalCompany') {
          payload.companyId = (data as any).companyId || ownerId;
          delete payload.providerId;
        } else if (entityType === 'privateProvider') {
          payload.providerId = (data as any).providerId || ownerId;
          delete payload.companyId;
        } else {
          payload.userId = (data as any).userId || ownerId; // agent
        }

        const newDoc = await addDoc(collection(db, 'bookings'), payload);
        setBookings((prev) => [
          ...prev,
          {
            id: newDoc.id,
            ...payload,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          } as Booking,
        ]);
      }
    } catch (error) {
      console.error('❌ Error saving booking:', error);
    }
  };

  const deleteBooking = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'bookings', id));
      setBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      console.error('❌ Error deleting booking:', error);
    }
  };

  return {
    bookings,
    stationNames,
    companyNames, // map id → name (company hoặc provider)
    packageNames,
    userNames,
    packages,
    vehicles,
    editingBooking,
    setEditingBooking,
    saveBooking,
    deleteBooking,
    loading,
  };
}
