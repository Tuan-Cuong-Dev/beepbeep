'use client';

import { useEffect, useState } from 'react';
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
import { Ebike } from '@/src/lib/ebikes/ebikeTypes';

export function useBookingData(filters?: { startDate?: string; endDate?: string }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stationNames, setStationNames] = useState<Record<string, string>>({});
  const [companyNames, setCompanyNames] = useState<Record<string, string>>({});
  const [packageNames, setPackageNames] = useState<Record<string, string>>({});
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [ebikes, setEbikes] = useState<Ebike[]>([]);
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData(filters);
  }, [filters]);

  const fetchAllData = async (filters?: { startDate?: string; endDate?: string }) => {
    setLoading(true);
    try {
      await Promise.all([
        fetchBookings(filters),
        fetchStations(),
        fetchCompanies(),
        fetchPackages(),
        fetchUsers(),
        fetchPackageList(),
        fetchEbikeList(),
      ]);
    } catch (error) {
      console.error('❌ Error loading booking-related data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async (filters?: { startDate?: string; endDate?: string }) => {
    const bookingRef = collection(db, 'bookings');
    let bookingQuery: Query<DocumentData> = bookingRef;

    if (filters?.startDate || filters?.endDate) {
      const conditions = [];

      if (filters.startDate) {
        const start = Timestamp.fromDate(new Date(filters.startDate + 'T00:00:00'));
        conditions.push(where('createdAt', '>=', start));
      }

      if (filters.endDate) {
        const end = Timestamp.fromDate(new Date(filters.endDate + 'T23:59:59'));
        conditions.push(where('createdAt', '<=', end));
      }

      bookingQuery = query(bookingRef, ...conditions);
    }

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

        bookingStatus: (data.bookingStatus as 'draft' | 'confirmed' | 'returned' | 'completed' | 'cancelled') ?? 'draft',
        statusComment: data.statusComment ?? '', 
        createdAt: toTimestamp(data.createdAt),
        updatedAt: toTimestamp(data.updatedAt),
      };
    });

    setBookings(list);
  };

  const fetchStations = async () => {
    const snap = await getDocs(collection(db, 'rentalStations'));
    const map: Record<string, string> = {};
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      map[docSnap.id] = data.name || 'Unnamed Station';
    });
    setStationNames(map);
  };

  const fetchCompanies = async () => {
    const snap = await getDocs(collection(db, 'rentalCompanies'));
    const map: Record<string, string> = {};
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      map[docSnap.id] = data.name || 'Unnamed Company';
    });
    setCompanyNames(map);
  };

  const fetchPackages = async () => {
    const snap = await getDocs(collection(db, 'subscriptionPackages'));
    const map: Record<string, string> = {};
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      map[docSnap.id] = data.name || 'Unnamed Package';
    });
    setPackageNames(map);
  };

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, 'users'));
    const map: Record<string, string> = {};
    snap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      map[docSnap.id] = data.name || 'Unnamed User';
    });
    setUserNames(map);
  };

  const fetchEbikeList = async () => {
    const snap = await getDocs(collection(db, 'ebikes'));
    const list: Ebike[] = snap.docs.map((docSnap) => ({
      ...(docSnap.data() as Ebike),
      id: docSnap.id,
    }));
    setEbikes(list);
  };

  const fetchPackageList = async () => {
    const snap = await getDocs(collection(db, 'subscriptionPackages'));
    const list: SubscriptionPackage[] = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as SubscriptionPackage),
    }));
    setPackages(list);
  };

  const saveBooking = async (data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingBooking) {
        const bookingRef = doc(db, 'bookings', editingBooking.id);
        await updateDoc(bookingRef, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        setBookings((prev) =>
          prev.map((b) =>
            b.id === editingBooking.id ? { ...b, ...data, updatedAt: Timestamp.now() } : b
          )
        );
        setEditingBooking(null);
      } else {
        const newDoc = await addDoc(collection(db, 'bookings'), {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setBookings((prev) => [
          ...prev,
          {
            id: newDoc.id,
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
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
    companyNames,
    packageNames,
    userNames,
    packages,
    ebikes,
    editingBooking,
    setEditingBooking,
    saveBooking,
    deleteBooking,
    loading,
  };
}
