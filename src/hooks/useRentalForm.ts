import { useState, useEffect } from 'react';
import { Timestamp, collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Ebike } from '@/src/lib/vehicles/vehicleTypes';
import { EbikeModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { Booking, SubmitResult } from '@/src/lib/booking/BookingTypes';
import { ensureCustomerByUserId, checkCustomerByPhone } from '@/src/lib/services/customers/customerService';
import { checkBatteryCode } from '@/src/lib/services/batteries/batteryService';
import { NotificationType } from '@/src/components/ui/NotificationDialog';

interface UseRentalFormOptions {
  onNotify?: (message: string, type?: NotificationType) => void;
}

export function useRentalForm(companyId: string, userId: string, options?: UseRentalFormOptions) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [allBikes, setAllBikes] = useState<(Ebike & { modelName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const onNotify = options?.onNotify;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const packageSnap = await getDocs(query(collection(db, 'subscriptionPackages'), where('companyId', '==', companyId)));
        const loadedPackages = packageSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SubscriptionPackage[];
        setPackages(loadedPackages);

        const bikeSnap = await getDocs(query(collection(db, 'ebikes'), where('companyId', '==', companyId)));
        const bikesRaw = bikeSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Ebike[];

        const availableBikes = bikesRaw.filter(bike => bike.status === 'Available');

        const bikesWithModelName = await Promise.all(
          availableBikes.map(async (bike) => {
            let modelName = '';
            if (bike.modelId) {
              try {
                const modelDoc = await getDoc(doc(db, 'ebikeModels', bike.modelId));
                if (modelDoc.exists()) {
                  const modelData = modelDoc.data() as EbikeModel;
                  modelName = modelData.name;
                }
              } catch (error) {
                console.error('❌ Error loading model for bike:', bike.id, error);
              }
            }
            return { ...bike, modelName };
          })
        );

        setAllBikes(bikesWithModelName);
      } catch (error) {
        console.error('❌ Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId) fetchData();
  }, [companyId]);

  const handleChange = (key: string, value: any) => {
  const processedValue = value; // ✅ Không trim ở đây để giữ nguyên input người dùng

  setFormData(prev => {
    const updated = { ...prev, [key]: processedValue };

    // ✅ Gán thông tin gói thuê nếu chọn package
    if (key.startsWith('package')) {
      const selectedPackage = packages.find(pkg => pkg.id === processedValue);
      if (selectedPackage) {
        updated.basePrice = selectedPackage.basePrice;
        updated.kmLimit = selectedPackage.kmLimit ?? 'Unlimited';
        updated.overageRate = selectedPackage.overageRate ?? '-';
        updated.chargingMethod = selectedPackage.chargingMethod;
      }
    }

    // ✅ Tự động gán info khi chọn xe
    if (key === 'vehicleSearch') {
      const selectedBike = allBikes.find(bike => bike.vehicleID === processedValue);
      if (selectedBike) {
        updated.stationId = selectedBike.stationId || '';
        updated.vin = selectedBike.vehicleID || '';
        updated.vehicleModel = selectedBike.modelName || '';
        updated.vehicleColor = selectedBike.color || '';
        updated.licensePlate = selectedBike.plateNumber || '';
      }
    }

    // ✅ Tính tiền thuê
    const rentalDays = Number(updated.rentalDays) || 0;
    const basePrice = Number(updated.basePrice) || 0;
    const batteryFee = Number(updated.batteryFee) || 0;
    const deposit = Number(updated.deposit) || 0;

    if (rentalDays && (basePrice || batteryFee)) {
      const totalAmount = rentalDays * basePrice + batteryFee;
      updated.totalAmount = totalAmount;
      updated.remainingBalance = totalAmount - deposit;
    }

    if (key === 'deposit' && updated.totalAmount) {
      updated.remainingBalance = updated.totalAmount - deposit;
    }

    // ✅ Tính ngày kết thúc thuê
    if (
      ['rentalStartDate', 'rentalStartHour', 'rentalDays'].includes(key) ||
      (updated.rentalStartDate && updated.rentalStartHour && updated.rentalDays)
    ) {
      const startDateStr = updated.rentalStartDate;
      const startHourStr = updated.rentalStartHour;
      const days = Number(updated.rentalDays) || 0;

      if (startDateStr && startHourStr && days) {
        const start = new Date(`${startDateStr}T${startHourStr}:00`);
        const end = new Date(start);
        end.setDate(start.getDate() + days);

        const yyyy = end.getFullYear();
        const mm = String(end.getMonth() + 1).padStart(2, '0');
        const dd = String(end.getDate()).padStart(2, '0');

        updated.rentalEndDate = `${yyyy}-${mm}-${dd}`;
      }
    }

    return updated;
  });

  // ✅ Kiểm tra battery code
  if (key.startsWith('batteryCode')) {
    if (typeof processedValue === 'string' && processedValue.length > 4) {
      checkBatteryCode(processedValue).then((battery) => {
        if (!battery || battery.status !== 'in_stock') {
          setFormData(current => ({
            ...current,
            [key]: '',
          }));
          onNotify?.(`Battery ${processedValue} is not available or already in use.`, 'error');
        }
      });
    }
  }

  // ✅ Kiểm tra số điện thoại tự động tìm khách hàng
  if (key === 'phone') {
    if (typeof processedValue === 'string' && processedValue.length >= 9) {
      checkCustomerByPhone(processedValue).then((customer) => {
        if (customer) {
          setFormData(current => ({
            ...current,
            phone: customer.phone,
            fullName: customer.name || '',
            email: customer.email || '',
            address: customer.address || '',
            idNumber: customer.idNumber || '',
            driverLicense: customer.driverLicense || '',
            dateOfBirth: customer.dateOfBirth || '',
            nationality: customer.nationality || '',
            sex: customer.sex || '',
            placeOfOrigin: customer.placeOfOrigin || '',
            placeOfResidence: customer.placeOfResidence || '',
          }));
        }
      });
    }
  }
};



  const resetForm = () => setFormData({});

  async function handleSubmit(): Promise<SubmitResult> {
    if (!formData.rentalStartDate || !formData.rentalStartHour || !formData.rentalDays) {
      return { status: 'validation_error' };
    }

    try {
      const startDate = new Date(`${formData.rentalStartDate}T${formData.rentalStartHour}:00`);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + Number(formData.rentalDays || 0));

      await ensureCustomerByUserId(userId, {
        userId,
        name: formData.fullName || '',
        email: formData.email || '',
        phone: formData.phone || '',
        address: formData.address || '',
        idNumber: formData.idNumber || '',
        driverLicense: formData.driverLicense || '',
        dateOfBirth: formData.dateOfBirth || null,
        nationality: formData.nationality || '',
        sex: formData.sex || '',
        placeOfOrigin: formData.placeOfOrigin || '',
        placeOfResidence: formData.placeOfResidence || '',
      });

      const bookingData: Omit<Booking, 'id'> = {
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
        rentalEndDate: Timestamp.fromDate(endDate),
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
        bookingStatus: 'draft',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      if (bookingData.vin) {
        const ebikeQuery = query(collection(db, 'ebikes'), where('vehicleID', '==', bookingData.vin));
        const ebikeSnap = await getDocs(ebikeQuery);
        if (!ebikeSnap.empty) {
          const ebikeDoc = ebikeSnap.docs[0];
          await updateDoc(ebikeDoc.ref, { status: 'In Use' });
        }
      }

      if (bookingData.batteryCode1) {
        const batteryQuery = query(collection(db, 'batteries'), where('batteryCode', '==', bookingData.batteryCode1));
        const batterySnap = await getDocs(batteryQuery);
        if (!batterySnap.empty) {
          const batteryDoc = batterySnap.docs[0];
          await updateDoc(batteryDoc.ref, { status: 'in_use' });
        }
      }

      resetForm();
      return {
        status: 'success',
        booking: {
          id: docRef.id,
          ...bookingData,
        },
      };
    } catch (error) {
      console.error('Booking failed:', error);
      return { status: 'error' };
    }
  }

  return {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    resetForm,
    packages,
    setPackages,
    loading,
    setLoading,
    allBikes,
    setAllBikes,
  };
}