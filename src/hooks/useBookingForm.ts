'use client';

import { Timestamp, collection, addDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Booking, SubmitResult } from '@/src/lib/booking/BookingTypes';
import { useRentalForm } from './useRentalForm';
import { useRentalStations } from '@/src/hooks/useRentalStations';
import { useUser } from '@/src/context/AuthContext';

export function useBookingForm(companyId: string, userId: string) {
  const rentalForm = useRentalForm(companyId, userId);
  const { role } = useUser();
  const isAdmin = role === 'Admin';

  const { formData } = rentalForm;

  // ✅ Lọc danh sách stations theo companyId
  const { stations, loading: stationsLoading } = useRentalStations(companyId, isAdmin);

  const handleSubmit = async (): Promise<SubmitResult> => {
    if (!formData.rentalStartDate || !formData.rentalStartHour || !formData.rentalDays) {
      return { status: 'validation_error' };
    }

    try {
      const startDate = new Date(`${formData.rentalStartDate}T${formData.rentalStartHour}:00`);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Number(formData.rentalDays || 0));

      const bookingData = {
        companyId,
        stationId: formData.stationId || '',
        userId: userId || '',

        idImage: formData.idImage || '',
        fullName: formData.fullName || '',
        channel: formData.channel || '',
        phone: formData.phone || '',
        idNumber: formData.idNumber || '',
        address: formData.address || '',

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
        rentalEndDate: Timestamp.fromDate(new Date(formData.rentalEndDate)),  

        package: formData.package || '',
        basePrice: Number(formData.basePrice) || 0,
        batteryFee: Number(formData.batteryFee) || 0,
        totalAmount: Number(formData.totalAmount) || 0,
        deposit: Number(formData.deposit) || 0,
        remainingBalance: Number(formData.remainingBalance) || 0,

        deliveryMethod: formData.deliveryMethod || 'Pickup at Shop',
        deliveryAddress: formData.deliveryAddress || '',

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

      // ✅ Cập nhật trạng thái xe: In Use
      if (bookingData.vin) {
        const ebikeSnap = await getDocs(
          query(collection(db, 'ebikes'), where('vehicleID', '==', bookingData.vin))
        );
        if (!ebikeSnap.empty) {
          const ebikeDoc = ebikeSnap.docs[0];
          await updateDoc(ebikeDoc.ref, { status: 'In Use' });
        }
      }

      // ✅ Cập nhật trạng thái pin: in_use
      if (bookingData.batteryCode1) {
        const batterySnap = await getDocs(
          query(collection(db, 'batteries'), where('batteryCode', '==', bookingData.batteryCode1))
        );
        if (!batterySnap.empty) {
          const batteryDoc = batterySnap.docs[0];
          await updateDoc(batteryDoc.ref, { status: 'in_use' });
        }
      }

      return {
        status: 'success',
        booking: {
          id: docRef.id,
          ...bookingData,
        } as Booking,
      };
    } catch (error) {
      console.error('❌ Booking failed:', error);
      return { status: 'error' };
    }
  };

  return {
    ...rentalForm,
    stations,         // ✅ Danh sách trạm đúng công ty
    stationsLoading,  // ✅ Loading để form biết khi nào hiển thị dropdown
    handleSubmit,
  };
}
