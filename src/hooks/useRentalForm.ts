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
  /** ⬇️ Mới: phân biệt công ty / người cho thuê cá nhân */
  entityType?: EntityType;
}

/**
 * @param ownerId: với rentalCompany = companyId, với privateProvider = providerId
 */
export function useRentalForm(ownerId: string, userId: string, options?: UseRentalFormOptions) {
  const entityType: EntityType = options?.entityType ?? 'rentalCompany';
  const onNotify = options?.onNotify;

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [allBikes, setAllBikes] = useState<(Vehicle & { modelName?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // ---------- PACKAGES ----------
        const pkgResults: SubscriptionPackage[] = [];

        // Schema chuẩn (rentalCompany)
        const pkgQ1 = query(collection(db, 'subscriptionPackages'), where('companyId', '==', ownerId));
        const pkgSnap1 = await getDocs(pkgQ1);
        pkgSnap1.forEach((d) => pkgResults.push({ id: d.id, ...(d.data() as any) }));

        // Nếu là privateProvider → hỗ trợ field providerId (schema mở rộng)
        if (entityType === 'privateProvider') {
          const pkgQ2 = query(collection(db, 'subscriptionPackages'), where('providerId', '==', ownerId));
          const pkgSnap2 = await getDocs(pkgQ2);
          pkgSnap2.forEach((d) => {
            if (!pkgResults.find((x) => x.id === d.id)) {
              pkgResults.push({ id: d.id, ...(d.data() as any) });
            }
          });
        }
        setPackages(pkgResults);

        // ---------- BIKES ----------
        const bikeResults: Vehicle[] = [];

        // Schema chuẩn (rentalCompany)
        const bikeQ1 = query(collection(db, 'vehicles'), where('companyId', '==', ownerId));
        const bikeSnap1 = await getDocs(bikeQ1);
        bikeSnap1.forEach((d) => bikeResults.push({ id: d.id, ...(d.data() as any) }));

        // Nếu là privateProvider → hỗ trợ field providerId (schema mở rộng)
        if (entityType === 'privateProvider') {
          const bikeQ2 = query(collection(db, 'vehicles'), where('providerId', '==', ownerId));
          const bikeSnap2 = await getDocs(bikeQ2);
          bikeSnap2.forEach((d) => {
            if (!bikeResults.find((x) => x.id === d.id)) {
              bikeResults.push({ id: d.id, ...(d.data() as any) });
            }
          });
        }

        const availablVehicles = bikeResults.filter((bike) => bike.status === 'Available');

        const bikesWithModelName = await Promise.all(
          availablVehicles.map(async (bike) => {
            let modelName = '';
            if ((bike as any).modelId) {
              try {
                const modelDoc = await getDoc(doc(db, 'vehicleModels', (bike as any).modelId));
                if (modelDoc.exists()) {
                  const modelData = modelDoc.data() as VehicleModel;
                  modelName = modelData.name;
                }
              } catch (error) {
                console.error('❌ Error loading model for bike:', (bike as any).id, error);
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

    if (ownerId) fetchData();
  }, [ownerId, entityType]);

  const handleChange = (key: string, value: any) => {
    const processedValue = value; // không trim để giữ nguyên input

    setFormData((prev) => {
      const updated = { ...prev, [key]: processedValue };

      // Gán thông tin gói thuê nếu chọn package
      if (key.startsWith('package')) {
        const selectedPackage = packages.find((pkg) => pkg.id === processedValue);
        if (selectedPackage) {
          updated.basePrice = selectedPackage.basePrice;
          updated.kmLimit = selectedPackage.kmLimit ?? 'Unlimited';
          updated.overageRate = selectedPackage.overageRate ?? '-';
          updated.chargingMethod = selectedPackage.chargingMethod;
        }
      }

      // Auto-fill khi chọn xe
      if (key === 'vehicleSearch') {
        const selectedBike = allBikes.find((bike) => bike.vehicleID === processedValue);
        if (selectedBike) {
          updated.stationId = (selectedBike as any).stationId || '';
          updated.vin = selectedBike.vehicleID || '';
          updated.vehicleModel = selectedBike.modelName || '';
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

      // Tính ngày kết thúc thuê
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

    // Kiểm tra battery code
    if (key.startsWith('batteryCode')) {
      if (typeof processedValue === 'string' && processedValue.length > 4) {
        checkBatteryCode(processedValue).then((battery) => {
          if (!battery || battery.status !== 'in_stock') {
            setFormData((current) => ({
              ...current,
              [key]: '',
            }));
            onNotify?.(`Battery ${processedValue} is not available or already in use.`, 'error');
          }
        });
      }
    }

    // Tự động tìm khách theo phone
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

      // Đảm bảo Customer tồn tại
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

      // ---------- DỮ LIỆU BOOKING ----------
      // Giữ tương thích: vẫn set companyId,
      // đồng thời thêm providerId và entityType khi là privateProvider
      const bookingBase: Omit<Booking, 'id'> = {
        companyId: entityType === 'rentalCompany' ? ownerId : '', // compat
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

      // Mở rộng theo entity
      const bookingData: any =
        entityType === 'privateProvider'
          ? { ...bookingBase, providerId: ownerId, entityType: 'privateProvider' }
          : { ...bookingBase, entityType: 'rentalCompany' };

      // Lưu booking
      const docRef = await addDoc(collection(db, 'bookings'), bookingData);

      // Cập nhật trạng thái xe
      if (bookingData.vin) {
        const VehicleQuery = query(collection(db, 'Vehicles'), where('vehicleID', '==', bookingData.vin));
        const VehicleSnap = await getDocs(VehicleQuery);
        if (!VehicleSnap.empty) {
          const VehicleDoc = VehicleSnap.docs[0];
          await updateDoc(VehicleDoc.ref, { status: 'In Use' });
        }
      }

      // Cập nhật trạng thái pin
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
