'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';
import {
  Bike,
  User as UserIcon,
  Calendar,
  PhoneCall,
  Coins,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Booking } from '@/src/lib/booking/BookingTypes';
import { format, differenceInDays } from 'date-fns';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/src/context/AuthContext';

/** Debounce nhỏ giảm số lần query */
function useDebounced<T>(value: T, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export default function ReturnPageClient() {
  const { t } = useTranslation('common');
  const { user, role, companyId } = useUser();

  const [ownerId, setOwnerId] = useState<string | null>(null); // companyId | providerId
  const normalizedRole = useMemo(() => (role || '').toLowerCase(), [role]);
  const entityType: 'rentalCompany' | 'privateProvider' =
    normalizedRole === 'private_provider' ? 'privateProvider' : 'rentalCompany';

  const [rentalInfo, setRentalInfo] = useState<Booking | null>(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const [switchOpen, setSwitchOpen] = useState(false);
  const [vehicleIdInput, setVehicleIdInput] = useState('');
  const term = useDebounced(vehicleIdInput.trim(), 350);

  const [bookingDocId, setBookingDocId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestions, setSuggestions] = useState<Booking[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // 0) Xác định ownerId (providerId cho privateProvider; companyId cho vai trò còn lại)
  useEffect(() => {
    const resolveOwner = async () => {
      if (entityType === 'privateProvider') {
        if (!user?.uid) return setOwnerId(null);
        try {
          const snap = await getDocs(
            query(collection(db, 'privateProviders'), where('ownerId', '==', user.uid))
          );
          setOwnerId(snap.empty ? null : snap.docs[0].id);
        } catch (e) {
          console.error('resolveOwner(privateProviders) failed:', e);
          setOwnerId(null);
        }
      } else {
        setOwnerId(companyId ?? null);
      }
    };
    resolveOwner();
  }, [entityType, user?.uid, companyId]);

  // 1) Gợi ý booking theo VIN/biển số (status=confirmed) – hỗ trợ cả companyId & providerId
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!ownerId || term.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoadingSuggestions(true);
      try {
        const statusFilter = where('bookingStatus', '==', 'confirmed');

        // Query 2 nhánh rồi gộp (do dữ liệu có thể lưu companyId hoặc providerId)
        const qCompany = query(collection(db, 'bookings'), statusFilter, where('companyId', '==', ownerId));
        const qProvider = query(collection(db, 'bookings'), statusFilter, where('providerId', '==', ownerId));

        let snapC = null, snapP = null;
        try { snapC = await getDocs(qCompany); } catch {}
        try { snapP = await getDocs(qProvider); } catch {}

        const byId = new Map<string, Booking>();
        const pushDoc = (d: any) => {
          const data = d.data() as Booking;
          const id = d.id as string;
          const vinOk = (data.vin || '').toLowerCase().includes(term.toLowerCase());
          const plateOk = (data.licensePlate || '').toLowerCase().includes(term.toLowerCase());
          if (vinOk || plateOk) byId.set(id, { ...data, id });
        };

        snapC?.forEach(pushDoc);
        snapP?.forEach(pushDoc);

        setSuggestions(Array.from(byId.values()));
      } catch (error) {
        console.error('fetchSuggestions failed:', error);
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [ownerId, term]);

  const handleSelectSuggestion = (booking: Booking) => {
    setRentalInfo(booking);
    setBookingDocId(booking.id!);
    // có thể set lại input cho rõ ràng
    setVehicleIdInput(booking.licensePlate ? `${booking.vin} - ${booking.licensePlate}` : booking.vin);
    setSuggestions([]);
  };

  // 2) Lấy basePrice từ vehicles nếu booking chưa có (tránh gán field lạ gây lỗi type)
  useEffect(() => {
    const fetchPriceFromVehicle = async () => {
      if (!rentalInfo?.vin || rentalInfo.basePrice) return;
      try {
        const vq = query(collection(db, 'vehicles'), where('vehicleID', '==', rentalInfo.vin));
        const vsnap = await getDocs(vq);
        if (!vsnap.empty) {
          const vdata = vsnap.docs[0].data() as Partial<Vehicle>;
          if (typeof vdata.pricePerDay === 'number') {
            setRentalInfo(prev => (prev ? { ...prev, basePrice: vdata.pricePerDay! } as Booking : prev));
          }
        }
      } catch (e) {
        console.warn('fetchPriceFromVehicle failed:', e);
      }
    };
    fetchPriceFromVehicle();
  }, [rentalInfo?.vin, rentalInfo?.basePrice]);

  // 3) Trả xe
  const processReturn = useCallback(async () => {
    if (!bookingDocId || !rentalInfo) return;

    try {
      const bookingRef = doc(db, 'bookings', bookingDocId);
      await updateDoc(bookingRef, {
        bookingStatus: 'returned',
        updatedAt: Timestamp.now(),
        statusComment: `Staff marked vehicle as returned on ${format(
          new Date(),
          'dd/MM/yyyy HH:mm'
        )}. Awaiting finance confirmation.`,
      });

      // Trả xe: set xe về Available
      const vq = query(collection(db, 'vehicles'), where('vehicleID', '==', rentalInfo.vin));
      const vsnap = await getDocs(vq);
      if (!vsnap.empty) {
        const vdoc = vsnap.docs[0];
        await updateDoc(doc(db, 'vehicles', vdoc.id), { status: 'Available', updatedAt: Timestamp.now() });
      }

      setSuccessMessage(t('return_page_client.success_return'));
      setRentalInfo(null);
      setBookingDocId(null);
      setVehicleIdInput('');
      setShowConfirmDialog(false);
    } catch (e) {
      console.error('processReturn failed:', e);
      setErrorMessage(t('return_page_client.error_return'));
    }
  }, [bookingDocId, rentalInfo, t]);

  const handleReturnBike = async () => {
    if (!bookingDocId || !rentalInfo) return;
    if ((rentalInfo.remainingBalance || 0) > 0) {
      setShowConfirmDialog(true);
      return;
    }
    await processReturn();
  };

  // 4) Đổi xe
  const handleSwitchConfirm = async (newBike: Vehicle) => {
    if (!bookingDocId || !rentalInfo) return;
    try {
      const bookingRef = doc(db, 'bookings', bookingDocId);

      // xe cũ → Available
      const oldQ = query(collection(db, 'vehicles'), where('vehicleID', '==', rentalInfo.vin));
      const oldSnap = await getDocs(oldQ);
      if (!oldSnap.empty) {
        const oldDoc = oldSnap.docs[0];
        await updateDoc(doc(db, 'vehicles', oldDoc.id), { status: 'Available', updatedAt: Timestamp.now() });
      }

      // xe mới → In Use
      await updateDoc(doc(db, 'vehicles', newBike.id), { status: 'In Use', updatedAt: Timestamp.now() });

      // cập nhật booking (dùng đúng field licensePlate cho UI)
      await updateDoc(bookingRef, {
        vin: newBike.vehicleID,
        licensePlate: newBike.plateNumber ?? '',
        vehicleId: newBike.id,
        updatedAt: Timestamp.now(),
        statusComment: `Switched from ${rentalInfo.vin} to ${newBike.vehicleID} on ${format(
          new Date(),
          'dd/MM/yyyy HH:mm'
        )}`,
      });

      const updatedSnap = await getDoc(bookingRef);
      if (updatedSnap.exists()) {
        setRentalInfo({ ...(updatedSnap.data() as Booking), id: bookingDocId });
        setSuccessMessage(t('return_page_client.success_switch', { vehicleID: newBike.vehicleID }));
      }
    } catch (e) {
      console.error('Switch vehicle failed:', e);
      setErrorMessage(t('return_page_client.error_switch'));
    }
  };

  // 5) Gia hạn
  const handleExtendConfirm = async (newEndTime: Timestamp) => {
    if (!rentalInfo?.id || !rentalInfo?.rentalStartDate) return;

    try {
      const bookingRef = doc(db, 'bookings', rentalInfo.id);
      const startDate =
        rentalInfo.rentalStartDate instanceof Timestamp
          ? rentalInfo.rentalStartDate.toDate()
          : new Date(rentalInfo.rentalStartDate as any);

      const endDate = newEndTime.toDate();
      const rentalDays = Math.max(1, differenceInDays(endDate, startDate)) + 1;
      const pricePerDay = rentalInfo.basePrice || 0; // dùng basePrice như “giá/ngày”
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
        setRentalInfo({ ...(updatedSnap.data() as Booking), id: rentalInfo.id });
      }

      setSuccessMessage(t('return_page_client.success_extend'));
      setExtendOpen(false);
    } catch (e) {
      console.error('Extend failed:', e);
      setErrorMessage(t('return_page_client.error_extend'));
    }
  };

  const formatDateTime = (date: any, hourStr?: string) => {
    if (!date) return '-';
    const dateObj = date instanceof Timestamp ? date.toDate() : new Date(date);
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
        <h1 className="text-3xl font-bold text-center mb-8">{t('return_page_client.title')}</h1>

        <div className="max-w-2xl mx-auto space-y-8">
          <Card className="shadow-md rounded-xl">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Bike className="w-5 h-5 text-[#00d289]" /> {t('return_page_client.search_heading')}
              </h2>

              <Input
                placeholder={t('return_page_client.search_placeholder')}
                value={vehicleIdInput}
                onChange={(e) => setVehicleIdInput(e.target.value)}
              />

              {loadingSuggestions && (
                <div className="text-sm text-gray-500">{t('common.loading', { defaultValue: 'Đang tải...' })}</div>
              )}

              {!loadingSuggestions && suggestions.length > 0 && (
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

              {/* ✨ Chỉ hiện “không có kết quả” khi CHƯA chọn booking */}
              {!loadingSuggestions && !rentalInfo && term.length >= 2 && suggestions.length === 0 && (
                <div className="text-xs text-gray-500">
                  {t('return_page_client.no_results', { defaultValue: 'Không tìm thấy kết quả' })}
                </div>
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
                <div className="flex gap-2">
                  <UserIcon className="w-4 h-4 text-[#00d289]" /> <strong>{t('return_page_client.renter')}:</strong>{' '}
                  {rentalInfo.fullName}
                </div>
                <div className="flex gap-2">
                  <PhoneCall className="w-4 h-4 text-[#00d289]" /> <strong>{t('return_page_client.phone')}:</strong>{' '}
                  {rentalInfo.phone}
                </div>
                <div className="flex gap-2">🔧 <strong>{t('return_page_client.vehicle_id')}:</strong> {rentalInfo.vin}</div>
                <div className="flex gap-2">🪪 <strong>{t('return_page_client.plate_number')}:</strong> {rentalInfo.licensePlate}</div>
                <div className="flex gap-2">
                  <Calendar className="w-4 h-4 text-[#00d289]" /> <strong>{t('return_page_client.start')}:</strong>{' '}
                  {formatDateTime(rentalInfo.rentalStartDate, rentalInfo.rentalStartHour)}
                </div>
                <div className="flex gap-2">
                  <Calendar className="w-4 h-4 text-[#00d289]" /> <strong>{t('return_page_client.end')}:</strong>{' '}
                  {formatDateTime(rentalInfo.rentalEndDate)}
                </div>
                <div className="flex gap-2">
                  <Coins className="w-4 h-4 text-[#00d289]" /> <strong>{t('return_page_client.price_per_day')}:</strong>{' '}
                  {(rentalInfo.basePrice || 0).toLocaleString()}₫
                </div>
                <div className="flex gap-2">
                  <Coins className="w-4 h-4 text-[#00d289]" /> <strong>{t('return_page_client.total')}:</strong>{' '}
                  {rentalInfo.totalAmount?.toLocaleString()}₫
                </div>
                <div className="flex gap-2">
                  <Coins className="w-4 h-4 text-[#00d289]" /> <strong>{t('return_page_client.deposit')}:</strong>{' '}
                  {rentalInfo.deposit?.toLocaleString()}₫
                </div>
                <div className="flex gap-2">
                  <Coins className="w-4 h-4 text-[#00d289]" /> <strong>{t('return_page_client.remaining')}:</strong>{' '}
                  {rentalInfo.remainingBalance?.toLocaleString()}₫
                </div>

                <div className="flex justify-between flex-wrap mt-6 gap-2">
                  <Button variant="outline" onClick={() => setExtendOpen(true)}>
                    {t('return_page_client.extend_button')}
                  </Button>
                  <Button variant="secondary" onClick={() => setSwitchOpen(true)}>
                    {t('return_page_client.switch_button')}
                  </Button>
                  <Button variant="default" onClick={handleReturnBike}>
                    {t('return_page_client.return_button')}
                  </Button>
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
              pricePerDay={rentalInfo.basePrice || 0}
              deposit={rentalInfo.deposit || 0}
            />
          )}

          {/* SwitchBikeModal mới nhận ownerId + entityType */}
          <SwitchBikeModal
            open={switchOpen}
            onClose={() => setSwitchOpen(false)}
            onConfirm={handleSwitchConfirm}
            ownerId={ownerId ?? undefined}
            entityType={entityType}
          />
        </div>
      </main>
      <Footer />

      {/* Confirm Return if Owing */}
      <NotificationDialog
        open={showConfirmDialog}
        type="confirm"
        title={t('return_page_client.confirm_title')}
        description={
          rentalInfo?.remainingBalance !== undefined
            ? t('return_page_client.confirm_description', {
                amount: rentalInfo.remainingBalance.toLocaleString(),
              })
            : ''
        }
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={processReturn}
      />
    </div>
  );
}
