// Hooks xữ lý việc nhập dữ liệu bookings
// Dùng cho bookingform

'use client';

import * as React from 'react';
import {
  Timestamp,
  collection,
  addDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Booking, SubmitResult } from '@/src/lib/booking/BookingTypes';
import { useRentalForm } from './useRentalForm';
import { useRentalStations } from '@/src/hooks/useRentalStations';
import { useUser } from '@/src/context/AuthContext';
import type { User } from '@/src/lib/users/userTypes';
import type { AddressCore } from '@/src/lib/locations/addressTypes'; // hoặc '@/src/lib/common/addressTypes' nếu đó mới là đường dẫn đúng

/* ================= Helpers ================= */

/** AddressCore -> string: ưu tiên formatted, rồi ghép line1..countryCode */
function addressCoreToString(addr?: AddressCore | null): string {
  if (!addr) return '';
  if (typeof addr.formatted === 'string' && addr.formatted.trim()) {
    return addr.formatted.trim();
  }
  const parts = [
    addr.line1,
    addr.line2,
    addr.locality, // city/town
    addr.adminArea, // state/province/region
    addr.postalCode,
    addr.countryCode, // ISO 3166-1 alpha-2
  ].filter((x): x is string => !!x && x.trim().length > 0);
  return parts.join(', ');
}

/** Lấy địa chỉ ưu tiên: profileAddress -> lastKnownLocation.address */
function preferredUserAddress(u?: Partial<User> | null): string {
  if (!u) return '';
  const p = addressCoreToString(u.profileAddress as AddressCore | undefined);
  if (p) return p;
  const last = addressCoreToString(
    (u as any)?.lastKnownLocation?.address as AddressCore | undefined
  );
  return last;
}

/** Tên đầy đủ ưu tiên first/last, fallback name */
function fullNameFromUser(u?: Partial<User> | null): string {
  if (!u) return '';
  const f = (u.firstName ?? '').trim();
  const l = (u.lastName ?? '').trim();
  const joined = `${f} ${l}`.trim();
  return joined || (u.name ?? '');
}

/** Chuẩn hoá chuỗi số → number (loại bỏ ký tự ngăn cách) */
const toNumber = (v: unknown): number => {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return Number(v.replace(/[^\d.-]/g, '')) || 0;
  return 0;
};

/* ================= Hook ================= */

export function useBookingForm(companyId: string, userId: string) {
  const rentalForm = useRentalForm(companyId, userId);
  const { role, user } = useUser();
  const isAdmin = role === 'Admin';

  const { formData, setFormData } = rentalForm;

  // ✅ Lọc danh sách stations theo companyId
  const { stations, loading: stationsLoading } = useRentalStations(
    companyId,
    isAdmin
  );

  /* ✅ Prefill renter info từ user đang đăng nhập (chỉ khi field trống) */
  React.useEffect(() => {
    if (!user) return;
    setFormData((prev: any) => ({
      ...prev,
      fullName: prev?.fullName || fullNameFromUser(user),
      phone: prev?.phone || (user.phone ?? ''),
      idNumber: prev?.idNumber || (user.idNumber ?? ''),
      address: prev?.address || preferredUserAddress(user),
      deliveryAddress: prev?.deliveryAddress || preferredUserAddress(user),
    }));
  }, [user, setFormData]);

  /* ⏱ Tự động tính ngày kết thúc khi đổi startDate/startHour/rentalDays */
  React.useEffect(() => {
    const d = formData?.rentalStartDate;
    const h = formData?.rentalStartHour;
    const days = Number(formData?.rentalDays ?? 0);
    if (!d || !h || !days) return;

    const start = new Date(`${d}T${h}:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + days);

    // Nếu form đang dùng string YYYY-MM-DD cho rentalEndDate:
    const newEndStr = end.toISOString().slice(0, 10);
    if ((formData as any)?.rentalEndDate !== newEndStr) {
      setFormData((prev: any) => ({ ...prev, rentalEndDate: newEndStr }));
    }
  }, [
    formData?.rentalStartDate,
    formData?.rentalStartHour,
    formData?.rentalDays,
    setFormData,
  ]);

  /* 💰 Tự động tính totalAmount & remainingBalance */
  React.useEffect(() => {
    const basePrice = toNumber(formData?.basePrice);
    const days = Number(formData?.rentalDays || 0);
    const batteryFee = toNumber(formData?.batteryFee);
    const deposit = toNumber(formData?.deposit);

    // Nếu có phí phụ kiện, cộng vào đây
    const extras = 0;
    const total = Math.max(0, basePrice * days + batteryFee + extras);
    const remaining = Math.max(0, total - deposit);

    if (
      formData?.totalAmount !== total ||
      formData?.remainingBalance !== remaining
    ) {
      setFormData((prev: any) => ({
        ...prev,
        totalAmount: total,
        remainingBalance: remaining,
      }));
    }
  }, [
    formData?.basePrice,
    formData?.rentalDays,
    formData?.batteryFee,
    formData?.deposit,
    setFormData,
  ]);

  const handleSubmit = async (): Promise<SubmitResult> => {
    if (
      !formData?.rentalStartDate ||
      !formData?.rentalStartHour ||
      !formData?.rentalDays
    ) {
      return { status: 'validation_error' };
    }

    try {
      const startDate = new Date(
        `${formData.rentalStartDate}T${formData.rentalStartHour}:00`
      );
      const tmpEnd = new Date(startDate);
      tmpEnd.setDate(startDate.getDate() + Number(formData.rentalDays || 0));

      const endDate =
        formData.rentalEndDate
          ? new Date(formData.rentalEndDate)
          : tmpEnd; // fallback nếu state chưa kịp sync

      const bookingData: Omit<Booking, 'id'> = {
        companyId,
        stationId: formData.stationId || '',
        userId: userId || '',

        idImage: formData.idImage || '',
        fullName: formData.fullName || fullNameFromUser(user),
        channel: formData.channel || '',
        phone: formData.phone || (user?.phone ?? ''),
        idNumber: formData.idNumber || (user?.idNumber ?? ''),
        address: formData.address || preferredUserAddress(user),

        vehicleSearch: formData.vehicleSearch || '',
        vehicleModel: formData.vehicleModel || '',
        vehicleColor: formData.vehicleColor || '',
        vin: formData.vin || '',
        licensePlate: formData.licensePlate || '',

        batteryCode1: formData.batteryCode1 || '',
        batteryCode2: formData.batteryCode2 || '',
        batteryCode3: formData.batteryCode3 || '',
        batteryCode4: formData.batteryCode4 || '',

        rentalStartDate: Timestamp.fromDate(startDate),
        rentalStartHour: formData.rentalStartHour || '',
        rentalDays: Number(formData.rentalDays || 0),
        rentalEndDate: Timestamp.fromDate(endDate),

        package: formData.package || '',
        basePrice: Number(formData.basePrice) || 0,
        batteryFee: Number(formData.batteryFee) || 0,
        totalAmount: Number(formData.totalAmount) || 0,
        deposit: Number(formData.deposit) || 0,
        remainingBalance: Number(formData.remainingBalance) || 0,

        deliveryMethod: formData.deliveryMethod || 'Pickup at Shop',
        deliveryAddress: formData.deliveryAddress || preferredUserAddress(user),

        helmet: formData.helmet ?? false,
        charger: formData.charger ?? false,
        phoneHolder: formData.phoneHolder ?? false,
        rearRack: formData.rearRack ?? false,
        raincoat: formData.raincoat ?? false,

        note: formData.note || '',

        bookingStatus: formData.bookingStatus || 'draft',
        statusComment: formData.statusComment || '',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      // ✅ Update trạng thái xe (nếu có vin)
      if (bookingData.vin) {
        const vehicleSnap = await getDocs(
          query(
            collection(db, 'vehicles'),
            where('vehicleID', '==', bookingData.vin)
          )
        );
        if (!vehicleSnap.empty) {
          const vehicleDoc = vehicleSnap.docs[0];
          await updateDoc(vehicleDoc.ref, { status: 'In Use' });
        }
      }

      // ✅ Update trạng thái pin (nếu có)
      if (bookingData.batteryCode1) {
        const batterySnap = await getDocs(
          query(
            collection(db, 'batteries'),
            where('batteryCode', '==', bookingData.batteryCode1)
          )
        );
        if (!batterySnap.empty) {
          const batteryDoc = batterySnap.docs[0];
          await updateDoc(batteryDoc.ref, { status: 'in_use' });
        }
      }

      return {
        status: 'success',
        booking: { id: docRef.id, ...bookingData } as Booking,
      };
    } catch (error) {
      console.error('❌ Booking failed:', error);
      return { status: 'error' };
    }
  };

  return {
    ...rentalForm,
    stations,
    stationsLoading,
    handleSubmit,
  };
}
