'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  Timestamp,
  updateDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Card, CardContent } from '@/src/components/ui/card';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import ExtendRentalModal from '@/src/components/return/ExtendRentalModal';
import SwitchBikeModal from '@/src/components/return/SwitchBikeModal';
import { Ebike } from '@/src/lib/ebikes/ebikeTypes'; // ✅ Sử dụng type gốc


import {
  Bike,
  User,
  Calendar,
  PhoneCall,
  Coins,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Booking } from '@/src/lib/booking/BookingTypes';
import { format, differenceInDays } from 'date-fns';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

export default function ReturnPageClient() {
  const [rentalInfo, setRentalInfo] = useState<any>(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [vehicleIdInput, setVehicleIdInput] = useState('');
  const [bookingDocId, setBookingDocId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Booking[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (vehicleIdInput.length < 2) return setSuggestions([]);

      const q = query(collection(db, 'bookings'), where('bookingStatus', '==', 'confirmed'));
      const snap = await getDocs(q);
      const matches: Booking[] = [];

      snap.forEach((docSnap) => {
        const data = docSnap.data() as Booking;
        if (
          data.vin?.toLowerCase().includes(vehicleIdInput.toLowerCase()) ||
          data.licensePlate?.toLowerCase().includes(vehicleIdInput.toLowerCase())
        ) {
          matches.push({ ...data, id: docSnap.id });
        }
      });

      setSuggestions(matches);
    };

    fetchSuggestions();
  }, [vehicleIdInput]);

  const handleSelectSuggestion = (booking: Booking) => {
    setRentalInfo(booking);
    setBookingDocId(booking.id);
    setSuggestions([]);
  };

  useEffect(() => {
    const fetchPriceFromEbike = async () => {
      if (!rentalInfo?.vin || rentalInfo.pricePerDay) return;

      const q = query(collection(db, 'ebikes'), where('vehicleID', '==', rentalInfo.vin));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const ebike = snap.docs[0].data();
        if (ebike.pricePerDay) {
          setRentalInfo((prev: any) => ({
            ...prev,
            pricePerDay: ebike.pricePerDay,
          }));
        }
      }
    };

    fetchPriceFromEbike();
  }, [rentalInfo?.vin]);

  const handleReturnBike = async () => {
    if (!bookingDocId || !rentalInfo) return;

    if (rentalInfo.remainingBalance > 0) {
      setShowConfirmDialog(true);
      return;
    }

    await processReturn();
  };

  // ✅ Xử lý khi xác nhận chuyển xe mới
    const handleSwitchConfirm = async (newBike: Ebike) => {
    if (!bookingDocId || !rentalInfo) return;

    try {
      const bookingRef = doc(db, 'bookings', bookingDocId);

      // Cập nhật trạng thái xe cũ → Available
      const oldBikeQuery = query(collection(db, 'ebikes'), where('vehicleID', '==', rentalInfo.vin));
      const oldBikeSnap = await getDocs(oldBikeQuery);
      if (!oldBikeSnap.empty) {
        const oldBikeDoc = oldBikeSnap.docs[0];
        await updateDoc(doc(db, 'ebikes', oldBikeDoc.id), {
          status: 'Available',
          updatedAt: Timestamp.now(),
        });
      }

      // Cập nhật xe mới → In Use
      await updateDoc(doc(db, 'ebikes', newBike.id), {
        status: 'In Use',
        updatedAt: Timestamp.now(),
      });

      // Cập nhật booking với thông tin xe mới
      await updateDoc(bookingRef, {
        vin: newBike.vehicleID,
        plateNumber: newBike.plateNumber,
        ebikeId: newBike.id,
        updatedAt: Timestamp.now(),
        statusComment: `Switched from ${rentalInfo.vin} to ${newBike.vehicleID} on ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      });

      // Cập nhật state
      const updatedSnap = await getDoc(bookingRef);
      if (updatedSnap.exists()) {
        setRentalInfo({ ...updatedSnap.data(), id: bookingDocId });
        setSuccessMessage(`Successfully switched to ${newBike.vehicleID}`);
      }
    } catch (error) {
      console.error('❌ Switch vehicle failed:', error);
      setErrorMessage('Failed to switch vehicle. Please try again.');
    }
  };


  const processReturn = async () => {
    if (!bookingDocId || !rentalInfo) return;

    const bookingRef = doc(db, 'bookings', bookingDocId);
    await updateDoc(bookingRef, {
      bookingStatus: 'returned', // Đã trả xe nhưng chưa xác nhận thu tiền
      updatedAt: Timestamp.now(),
      statusComment: `Staff marked vehicle as returned on ${format(new Date(), 'dd/MM/yyyy HH:mm')}. Awaiting finance confirmation.`
    });

    const ebikeQuery = query(collection(db, 'ebikes'), where('vehicleID', '==', rentalInfo.vin));
    const ebikeSnap = await getDocs(ebikeQuery);
    if (!ebikeSnap.empty) {
      const ebikeDoc = ebikeSnap.docs[0];
      await updateDoc(doc(db, 'ebikes', ebikeDoc.id), {
        status: 'available',
        updatedAt: Timestamp.now(),
      });
    }

    setSuccessMessage('Vehicle has been successfully returned and marked as available.');
    setRentalInfo(null);
    setBookingDocId(null);
    setVehicleIdInput('');
    setShowConfirmDialog(false);
  };

  const handleExtendConfirm = async (newEndTime: Timestamp) => {
    if (!rentalInfo?.id || !rentalInfo?.rentalStartDate) return;

    const bookingRef = doc(db, 'bookings', rentalInfo.id);
    const startDate = rentalInfo.rentalStartDate instanceof Timestamp
      ? rentalInfo.rentalStartDate.toDate()
      : new Date(rentalInfo.rentalStartDate);

    const endDate = newEndTime.toDate();
    const rentalDays = Math.max(1, differenceInDays(endDate, startDate)) + 1;
    const pricePerDay = rentalInfo.pricePerDay || 0;
    const deposit = rentalInfo.deposit || 0;
    const totalAmount = rentalDays * pricePerDay;
    const remainingBalance = totalAmount - deposit;

    await updateDoc(bookingRef, {
      rentalEndDate: newEndTime,
      rentalDays,
      totalAmount,
      remainingBalance,
      updatedAt: Timestamp.now(),
      statusComment: `Rental extended to ${format(endDate, 'dd/MM/yyyy HH:mm')}`,
    });

    const updatedSnap = await getDoc(bookingRef);
    if (updatedSnap.exists()) {
      setRentalInfo({ ...updatedSnap.data(), id: rentalInfo.id });
    }

    setSuccessMessage('Rental time successfully extended.');
    setExtendOpen(false);
  };

  const formatDateTime = (date: any, hourStr?: string) => {
    if (!date) return '-';
    let dateObj: Date;
    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } else {
      dateObj = new Date(date);
    }

    if (hourStr) {
      const [hour, minute] = hourStr.split(':').map(Number);
      dateObj.setHours(hour || 0, minute || 0);
    }

    return format(dateObj, 'dd/MM/yyyy HH:mm');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />
      <main className="flex-1 py-10 px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Return Vehicle</h1>

        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="shadow-md rounded-xl">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#00d289]" /> Search by VIN or Plate Number
              </h2>
              <Input
                placeholder="Type at least 2 characters..."
                value={vehicleIdInput}
                onChange={(e) => setVehicleIdInput(e.target.value)}
              />
              {suggestions.length > 0 && (
                <ul className="bg-white border shadow rounded max-h-60 overflow-y-auto">
                  {suggestions.map((sug) => (
                    <li
                      key={sug.id}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => handleSelectSuggestion(sug)}
                    >
                      {sug.vin} {sug.licensePlate ? `- ${sug.licensePlate}` : ''}
                    </li>
                  ))}
                </ul>
              )}
              {successMessage && (
                <div className="text-green-600 flex items-center gap-1 text-sm mt-2">
                  <CheckCircle className="w-4 h-4" /> {successMessage}
                </div>
              )}
              {errorMessage && (
                <div className="text-red-600 flex items-center gap-1 text-sm mt-2">
                  <AlertCircle className="w-4 h-4" /> {errorMessage}
                </div>
              )}
            </CardContent>
          </Card>

          {rentalInfo && (
            <Card className="shadow-md rounded-xl">
              <CardContent className="p-5 space-y-4 text-sm text-gray-800">
                <div className="flex gap-2"><User className="w-4 h-4 text-[#00d289]" /> <strong>Renter:</strong> {rentalInfo.fullName}</div>
                <div className="flex gap-2"><PhoneCall className="w-4 h-4 text-[#00d289]" /> <strong>Phone:</strong> {rentalInfo.phone}</div>
                <div className="flex gap-2"><span className="text-[#00d289]">🔧</span> <strong>Vehicle ID:</strong> {rentalInfo.vin}</div>
                <div className="flex gap-2"><span className="text-[#00d289]">🪪</span> <strong>Plate Number:</strong> {rentalInfo.licensePlate}</div>
                <div className="flex gap-2"><Calendar className="w-4 h-4 text-[#00d289]" /> <strong>Start:</strong> {formatDateTime(rentalInfo.rentalStartDate, rentalInfo.rentalStartHour)}</div>
                <div className="flex gap-2"><Calendar className="w-4 h-4 text-[#00d289]" /> <strong>End:</strong> {formatDateTime(rentalInfo.rentalEndDate)}</div>
                <div className="flex gap-2"><Coins className="w-4 h-4 text-[#00d289]" /> <strong>Price / Day:</strong> {(rentalInfo.pricePerDay || 0).toLocaleString()}₫</div>
                <div className="flex gap-2"><Coins className="w-4 h-4 text-[#00d289]" /> <strong>Total:</strong> {rentalInfo.totalAmount?.toLocaleString()}₫</div>
                <div className="flex gap-2"><Coins className="w-4 h-4 text-[#00d289]" /> <strong>Deposit:</strong> {rentalInfo.deposit?.toLocaleString()}₫</div>
                <div className="flex gap-2"><Coins className="w-4 h-4 text-[#00d289]" /> <strong>Remaining:</strong> {rentalInfo.remainingBalance?.toLocaleString()}₫</div>

                <div className="flex justify-between flex-wrap mt-6 gap-2">
                  <Button variant="outline" onClick={() => setExtendOpen(true)}>Extend Rental</Button>
                  <Button variant="secondary" onClick={() => setSwitchOpen(true)}>Switch Vehicle</Button>
                  <Button variant="default" onClick={handleReturnBike}>Return Vehicle</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {rentalInfo && (
            <ExtendRentalModal
              open={extendOpen}
              onClose={() => setExtendOpen(false)}
              onConfirm={handleExtendConfirm}
              rentalStartDate={rentalInfo.rentalStartDate}
              oldRentalEndDate={rentalInfo.rentalEndDate}
              pricePerDay={rentalInfo.pricePerDay || 0}
              deposit={rentalInfo.deposit || 0}
            />
          )}

          <SwitchBikeModal
            open={switchOpen}
            onClose={() => setSwitchOpen(false)}
            onConfirm={handleSwitchConfirm}
          />

        </div>
      </main>
      <Footer />

      {/* Confirmation Dialog */}
      <NotificationDialog
        open={showConfirmDialog}
        type="confirm"
        title="Confirm Remaining Balance"
        description={
          rentalInfo?.remainingBalance !== undefined
            ? `The customer still owes ${rentalInfo.remainingBalance.toLocaleString()}₫. Have you collected this amount?`
            : ''
        }
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={processReturn}
      />
    </div>
  );
}
