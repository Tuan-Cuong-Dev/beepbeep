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
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Booking } from '@/src/lib/booking/BookingTypes';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';

type EntityType = 'rentalCompany' | 'privateProvider';

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

  // Field nhận diện chủ sở hữu tuỳ entity
  const ownerField = useMemo(
    () => (entityType === 'privateProvider' ? 'providerId' : 'companyId'),
    [entityType]
  );

  useEffect(() => {
    if (!ownerId) return;
    fetchAllData(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownerId, entityType, JSON.stringify(filters)]);

  const fetchAllData = async (fs?: { startDate?: string; endDate?: string }) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBookings(fs),
        fetchStations(),
        fetchCompanies(),
        fetchPackagesNameMap(),
        fetchUsers(),
        fetchPackageList(),
        fetchVehicleList(),
      ]);
    } catch (error) {
      console.error('❌ Error loading booking-related data:', error);
    } finally {
      setLoading(false);
    }
  };

  // -------- BOOKINGS (lọc theo owner + khoảng thời gian) --------
  const fetchBookings = async (fs?: { startDate?: string; endDate?: string }) => {
    const bookingRef = collection(db, 'bookings');

    const conditions: any[] = [where(ownerField, '==', ownerId)];
    if (fs?.startDate) {
      conditions.push(where('createdAt', '>=', Timestamp.fromDate(new Date(fs.startDate + 'T00:00:00'))));
    }
    if (fs?.endDate) {
      conditions.push(where('createdAt', '<=', Timestamp.fromDate(new Date(fs.endDate + 'T23:59:59'))));
    }

    const bookingQuery: Query<DocumentData> = query(bookingRef, ...conditions);
    const snap = await getDocs(bookingQuery);

    const toTimestamp = (val: any): Timestamp => {
      if (val instanceof Timestamp) return val;
      if (val?.toDate) return Timestamp.fromDate(val.toDate());
      if (val instanceof Date) return Timestamp.fromDate(val);
      if (typeof val === 'string' || typeof val === 'number') return Timestamp.fromDate(new Date(val));
      return Timestamp.now();
    };

    const list: Booking[] = snap.docs.map((docSnap) => {
      const data = docSnap.data();

      return {
        id: docSnap.id,
        companyId: String(data.companyId ?? ''),
        // nếu có providerId trong schema, có thể thêm vào type Booking sau
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

        deliveryMethod: data.deliveryMethod === 'Deliver to Address' ? 'Deliver to Address' : 'Pickup at Shop',
        deliveryAddress: data.deliveryAddress ? String(data.deliveryAddress) : undefined,

        helmet: Boolean(data.helmet ?? false),
        charger: Boolean(data.charger ?? false),
        phoneHolder: Boolean(data.phoneHolder ?? false),
        rearRack: Boolean(data.rearRack ?? false),
        raincoat: Boolean(data.raincoat ?? false),
        note: data.note ? String(data.note) : undefined,

        bookingStatus:
          (data.bookingStatus as 'draft' | 'confirmed' | 'returned' | 'completed' | 'cancelled') ?? 'draft',
        statusComment: data.statusComment ?? '',
        createdAt: toTimestamp(data.createdAt),
        updatedAt: toTimestamp(data.updatedAt),
      };
    });

    setBookings(list);
  };

  // -------- STATIONS (lọc theo owner) --------
  const fetchStations = async () => {
    const col = collection(db, 'rentalStations');
    const q = query(col, where(ownerField, '==', ownerId));
    const snap = await getDocs(q);
    const map: Record<string, string> = {};
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      map[docSnap.id] = data.name || 'Unnamed Station';
    });
    setStationNames(map);
  };

  // -------- COMPANIES / PROVIDERS (tên) --------
  const fetchCompanies = async () => {
    // tái sử dụng state companyNames để map id → name cho cả company lẫn provider
    const colName = entityType === 'privateProvider' ? 'privateProviders' : 'rentalCompanies';
    const snap = await getDocs(query(collection(db, colName), where('ownerId', '!=', null)));
    const map: Record<string, string> = {};
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      map[docSnap.id] = data.name || (entityType === 'privateProvider' ? 'Provider' : 'Company');
    });
    setCompanyNames(map);
  };

  // -------- PACKAGES (name map theo owner) --------
  const fetchPackagesNameMap = async () => {
    const col = collection(db, 'subscriptionPackages');
    const snap = await getDocs(query(col, where(ownerField, '==', ownerId)));
    const map: Record<string, string> = {};
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      map[docSnap.id] = data.name || 'Unnamed Package';
    });
    setPackageNames(map);
  };

  // -------- USERS (tuỳ rules cho phép) --------
  const fetchUsers = async () => {
    try {
      const snap = await getDocs(collection(db, 'users'));
      const map: Record<string, string> = {};
      snap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        map[docSnap.id] = data.name || 'Unnamed User';
      });
      setUserNames(map);
    } catch {
      console.warn('⚠️ Cannot read users (rules may block).');
      setUserNames({});
    }
  };

  // -------- VEHICLES (lọc theo owner) --------
  const fetchVehicleList = async () => {
    const snap = await getDocs(query(collection(db, 'vehicles'), where(ownerField, '==', ownerId)));
    const list: Vehicle[] = snap.docs.map((docSnap) => ({
      ...(docSnap.data() as Vehicle),
      id: docSnap.id,
    }));
    setVehicles(list);
  };

  // -------- PACKAGES (list theo owner) --------
  const fetchPackageList = async () => {
    const snap = await getDocs(query(collection(db, 'subscriptionPackages'), where(ownerField, '==', ownerId)));
    const list: SubscriptionPackage[] = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as SubscriptionPackage),
    }));
    setPackages(list);
  };

  // -------- CREATE / UPDATE / DELETE --------
  const saveBooking = async (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingBooking) {
        const bookingRef = doc(db, 'bookings', editingBooking.id);

        // Giữ entity cũ (nếu có), fallback theo hook hiện tại
        const persistedEntityType: EntityType = (editingBooking as any).entityType ?? entityType;
        const payload: any = {
          ...data,
          entityType: persistedEntityType,
          updatedAt: serverTimestamp(),
        };
        if (persistedEntityType === 'rentalCompany') {
          payload.companyId = (editingBooking as any).companyId || (data as any).companyId || ownerId;
          delete payload.providerId;
        } else {
          payload.providerId = (editingBooking as any).providerId || (data as any).providerId || ownerId;
          delete payload.companyId;
        }

        await updateDoc(bookingRef, payload);
        setBookings((prev) =>
          prev.map((b) =>
            b.id === editingBooking.id ? ({ ...b, ...payload, updatedAt: Timestamp.now() } as Booking) : b
          )
        );
        setEditingBooking(null);
      } else {
        // Tạo mới: gắn entity đúng
        const payload: any = {
          ...data,
          entityType,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        if (entityType === 'rentalCompany') {
          payload.companyId = (data as any).companyId || ownerId;
          delete payload.providerId;
        } else {
          payload.providerId = (data as any).providerId || ownerId;
          delete payload.companyId;
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
    companyNames, // map id → name (company hoặc provider tuỳ entity)
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
