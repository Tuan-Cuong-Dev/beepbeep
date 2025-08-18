// /hooks/useRentalForm.ts
import { useState, useEffect } from 'react';
import {
  Timestamp,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';
import { Booking, SubmitResult } from '@/src/lib/booking/BookingTypes';
import { ensureCustomerByUserId, checkCustomerByPhone } from '@/src/lib/services/customers/customerService';
import { checkBatteryCode } from '@/src/lib/services/batteries/batteryService';
import { NotificationType } from '@/src/components/ui/NotificationDialog';

type EntityType = 'rentalCompany' | 'privateProvider';

interface UseRentalFormOptions {
  onNotify?: (message: string, type?: NotificationType) => void;
  entityType?: EntityType;
}

/**
 * @param ownerId: rentalCompany = companyId | privateProvider = providerId
 */
export function useRentalForm(ownerId: string, userId: string, options?: UseRentalFormOptions) {
  const entityType: EntityType = options?.entityType ?? 'rentalCompany';
  const onNotify = options?.onNotify;

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [allBikes, setAllBikes] = useState<(Vehicle & { modelName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  // Helper: fetch theo owner (companyId + optional providerId)
  const fetchByOwner = async <T extends { id?: string }>(
    colName: string
  ): Promise<(T & { id: string })[]> => {
    const out: (T & { id: string })[] = [];

    // Query theo companyId
    const q1 = query(collection(db, colName), where('companyId', '==', ownerId));
    const s1 = await getDocs(q1);
    s1.forEach((d) => out.push({ id: d.id, ...(d.data() as any) }));

    // Query theo providerId (chỉ khi privateProvider)
    if (entityType === 'privateProvider') {
      const q2 = query(collection(db, colName), where('providerId', '==', ownerId));
      const s2 = await getDocs(q2);
      s2.forEach((d) => {
        if (!out.find((x) => x.id === d.id)) out.push({ id: d.id, ...(d.data() as any) });
      });
    }

    return out;
  };

  useEffect(() => {
    if (!ownerId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        // PACKAGES
        const pkgResults = await fetchByOwner<SubscriptionPackage>('subscriptionPackages');
        setPackages(pkgResults);

        // VEHICLES
        const vehicleResults = await fetchByOwner<Vehicle>('vehicles');

        const availableVehicles = vehicleResults.filter(
          (v: any) => String(v.status || '').toLowerCase() === 'available'
        );

        // Enrich modelName (fallback nếu bị chặn quyền hoặc thiếu doc)
        const bikesWithModelName = await Promise.all(
          availableVehicles.map(async (bike) => {
            if ((bike as any).modelName) return { ...bike, modelName: (bike as any).modelName };

            let modelName = '';
            try {
              if ((bike as any).modelId) {
                const modelSnap = await getDoc(doc(db, 'vehicleModels', (bike as any).modelId));
                if (modelSnap.exists()) {
                  const modelData = modelSnap.data() as VehicleModel;
                  modelName = modelData?.name || '';
                }
              }
            } catch (error) {
              console.error('❌ Error loading model for bike:', (bike as any).id, error);
              modelName = 'Unknown model';
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

    fetchData();
  }, [ownerId, entityType]);

  const handleChange = (key: string, value: any) => {
    const processedValue = value;

    setFormData((prev) => {
      const updated = { ...prev, [key]: processedValue };

      // Chọn gói → set info
      if (key.startsWith('package')) {
        const selectedPackage = packages.find((pkg) => pkg.id === processedValue);
        if (selectedPackage) {
          updated.basePrice = selectedPackage.basePrice;
          updated.kmLimit = selectedPackage.kmLimit ?? 'Unlimited';
          updated.overageRate = selectedPackage.overageRate ?? '-';
          updated.chargingMethod = selectedPackage.chargingMethod;
        }
      }

      // Chọn xe → autofill
      if (key === 'vehicleSearch') {
        const selectedBike = allBikes.find((bike) => (bike as any).vehicleID === processedValue);
        if (selectedBike) {
          updated.stationId = (selectedBike as any).stationId || '';
          updated.vin = (selectedBike as any).vehicleID || '';
          updated.vehicleModel = (selectedBike as any).modelName || '';
          updated.vehicleColor = (selectedBike as any).color || '';
          updated.licensePlate = (selectedBike as any).plateNumber || '';
        }
      }

      // Tính tiền
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

      // Tính ngày kết thúc
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

    // Kiểm tra battery
    if (key.startsWith('batteryCode')) {
      if (typeof processedValue === 'string' && processedValue.length > 4) {
        checkBatteryCode(processedValue).then((battery) => {
          if (!battery || battery.status !== 'in_stock') {
            setFormData((current) => ({ ...current, [key]: '' }));
            onNotify?.(`Battery ${processedValue} is not available or already in use.`, 'error');
          }
        });
      }
    }

    // Tự động điền khách hàng theo phone
    if (key === 'phone') {
      if (typeof processedValue === 'string' && processedValue.length >= 9) {
        checkCustomerByPhone(processedValue).then((customer) => {
          if (customer) {
            setFormData((current) => ({
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

      // Bảo đảm Customer
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

      // Base booking (không set companyId rỗng)
      const bookingBase: Omit<Booking, 'id'> = {
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
        companyId: ''
      };

      const bookingData: any =
        entityType === 'privateProvider'
          ? { ...bookingBase, providerId: ownerId, entityType: 'privateProvider' }
          : { ...bookingBase, companyId: ownerId, entityType: 'rentalCompany' };

      // 1) Tạo booking
      let docRef;
      try {
        docRef = await addDoc(collection(db, 'bookings'), bookingData);
        console.log('[OK] bookings.addDoc →', docRef.id);
      } catch (e) {
        console.error('[FAIL] bookings.addDoc', e);
        return { status: 'error' };
      }

      // 2) Cập nhật trạng thái xe
      try {
        if (bookingData.vin) {
          const vehicleQuery = query(collection(db, 'vehicles'), where('vehicleID', '==', bookingData.vin));
          const vehicleSnap = await getDocs(vehicleQuery);
          if (!vehicleSnap.empty) {
            const vehicleDoc = vehicleSnap.docs[0];
            await updateDoc(vehicleDoc.ref, { status: 'In Use' });
            console.log('[OK] vehicles.updateDoc →', vehicleDoc.id);
          } else {
            console.warn('[WARN] vehicles not found for VIN', bookingData.vin);
          }
        }
      } catch (e) {
        console.error('[FAIL] vehicles.updateDoc', e);
        return { status: 'error' };
      }

      // 3) Cập nhật trạng thái pin
      try {
        if (bookingData.batteryCode1) {
          const batteryQuery = query(collection(db, 'batteries'), where('batteryCode', '==', bookingData.batteryCode1));
          const batterySnap = await getDocs(batteryQuery);
          if (!batterySnap.empty) {
            const batteryDoc = batterySnap.docs[0];
            await updateDoc(batteryDoc.ref, { status: 'in_use' });
            console.log('[OK] batteries.updateDoc →', batteryDoc.id);
          } else {
            console.warn('[WARN] battery not found', bookingData.batteryCode1);
          }
        }
      } catch (e) {
        console.error('[FAIL] batteries.updateDoc', e);
        return { status: 'error' };
      }

      resetForm();
      return { status: 'success', booking: { id: docRef.id, ...bookingData } };
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
