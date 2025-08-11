'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

import {
  VehicleModel,
  VehicleType,
  FuelType,
  VEHICLE_TYPE_LABELS,
  VEHICLE_SUBTYPE_OPTIONS,
  VEHICLE_SUBTYPE_LABELS,
  FUEL_TYPE_LABELS,
} from '@/src/lib/vehicle-models/vehicleModelTypes';

interface UseVehicleModelOptions {
  companyId?: string;
  isAdmin?: boolean;
  onSaveComplete?: () => void;
}

type SelectOption = { label: string; value: string };

const vehicleTypeOptions: SelectOption[] = (Object.keys(VEHICLE_TYPE_LABELS) as VehicleType[]).map(
  (k) => ({ value: k, label: VEHICLE_TYPE_LABELS[k] })
);

const fuelTypeOptions: SelectOption[] = (Object.keys(FUEL_TYPE_LABELS) as FuelType[]).map((k) => ({
  value: k,
  label: FUEL_TYPE_LABELS[k],
}));

export function useVehicleModel({
  companyId,
  isAdmin = false,
  onSaveComplete,
}: UseVehicleModelOptions) {
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUpdateModeModel, setIsUpdateModeModel] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultModel: VehicleModel = {
    id: '',
    companyId: companyId ?? '',
    name: '',
    description: '',
    vehicleType: 'bike',         // mặc định
    vehicleSubType: undefined,   // phụ thuộc vehicleType
    brand: '',
    modelCode: '',
    batteryCapacity: '',
    motorPower: '',
    fuelType: undefined,         // electric | gasoline | hybrid
    topSpeed: 0,
    range: 0,
    weight: 0,
    maxLoad: undefined,
    capacity: undefined,         // cho car/bus nếu dùng
    pricePerHour: undefined,
    pricePerDay: 0,
    pricePerWeek: undefined,
    pricePerMonth: undefined,
    imageUrl: '',
    available: true,
  };

  const [newVehicleModel, setNewVehicleModel] = useState<VehicleModel>(defaultModel);

  /** Subtype options theo vehicleType hiện tại */
  const vehicleSubtypeOptions: SelectOption[] = VEHICLE_SUBTYPE_OPTIONS
    .filter((o) => o.vehicleType === newVehicleModel.vehicleType)
    .map((o) => ({ label: o.label, value: o.value }));

  /** helper: cập nhật trường */
  const handleChange = <K extends keyof VehicleModel>(key: K, value: VehicleModel[K]) => {
    setNewVehicleModel((prev) => ({ ...prev, [key]: value }));
  };

  /** khi đổi loại phương tiện: reset subtype nếu không còn hợp lệ */
  const setVehicleType = (type: VehicleType) => {
    setNewVehicleModel((prev) => {
      const stillValid =
        prev.vehicleSubType &&
        VEHICLE_SUBTYPE_OPTIONS.some((s) => s.value === prev.vehicleSubType && s.vehicleType === type);
      return {
        ...prev,
        vehicleType: type,
        vehicleSubType: stillValid ? prev.vehicleSubType : undefined,
      };
    });
  };

  /** edit 1 model */
  const setEditModel = (model: VehicleModel) => {
    setNewVehicleModel(model);
    setIsUpdateModeModel(true);
    setError(null);
  };

  /** reset form */
  const resetForm = () => {
    setNewVehicleModel({
      ...defaultModel,
      companyId: companyId ?? '',
    });
    setIsUpdateModeModel(false);
    setError(null);
  };

  /** validate cơ bản */
  const validate = (m: VehicleModel): string[] => {
    const errs: string[] = [];
    if (!m.name?.trim()) errs.push('Name is required');
    if (!m.description?.trim()) errs.push('Description is required');
    if (!m.companyId?.trim()) errs.push('Company ID is required');
    if (!m.vehicleType) errs.push('Vehicle type is required');

    const isNumberOrUndef = (v: unknown) => v === undefined || v === null || typeof v === 'number';
    const nonNegativeOrUndef = (v?: number) => v === undefined || v >= 0;

    if (!nonNegativeOrUndef(m.pricePerDay)) errs.push('Price/Day must be >= 0');
    if (!isNumberOrUndef(m.pricePerHour)) errs.push('Price/Hour must be a number');
    if (!isNumberOrUndef(m.pricePerWeek)) errs.push('Price/Week must be a number');
    if (!isNumberOrUndef(m.pricePerMonth)) errs.push('Price/Month must be a number');

    if (!nonNegativeOrUndef(m.topSpeed)) errs.push('Top speed must be >= 0');
    if (!nonNegativeOrUndef(m.range)) errs.push('Range must be >= 0');
    if (!nonNegativeOrUndef(m.weight)) errs.push('Weight must be >= 0');
    if (!nonNegativeOrUndef(m.maxLoad)) errs.push('Max load must be >= 0');
    if (!nonNegativeOrUndef(m.capacity)) errs.push('Capacity must be >= 0');

    return errs;
  };

  /** fetch models */
  const fetchModels = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isAdmin && (!companyId || companyId.trim() === '')) {
        console.warn('⚠️ Skipped fetchModels due to empty companyId');
        setLoading(false);
        return;
      }

      const base = collection(db, 'vehicleModels');
      const q = isAdmin ? base : query(base, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);

      const data: VehicleModel[] = snapshot.docs.map((d) => {
        const docData = d.data() as DocumentData;
        return {
          id: d.id,
          ...docData,
        } as VehicleModel;
      });

      // sắp xếp theo name tăng dần
      data.sort((a, b) => a.name.localeCompare(b.name));
      setModels(data);
    } catch (err) {
      console.error('❌ Failed to fetch vehicle models:', err);
      setError('Failed to fetch vehicle models');
    } finally {
      setLoading(false);
    }
  };

  /** save (add/update) */
  const handleSave = async () => {
    const errs = validate(newVehicleModel);
    if (errs.length) {
      setError(errs.join('\n'));
      alert(errs.join('\n')); // tuỳ bạn thay bằng toast
      return;
    }

    setLoading(true);
    setError(null);

    // chuẩn hoá dữ liệu number/optional trước khi lưu
    const num = (v: unknown) => (typeof v === 'number' ? v : Number(v ?? 0));
    const optNum = (v: unknown) => (v === undefined || v === null || v === '' ? undefined : Number(v));

    const toSave: Omit<VehicleModel, 'id'> = {
      ...newVehicleModel,
      companyId: companyId ?? '',
      topSpeed: num(newVehicleModel.topSpeed),
      range: num(newVehicleModel.range),
      weight: num(newVehicleModel.weight),
      pricePerDay: num(newVehicleModel.pricePerDay),
      maxLoad: optNum(newVehicleModel.maxLoad),
      capacity: optNum(newVehicleModel.capacity),
      pricePerHour: optNum(newVehicleModel.pricePerHour),
      pricePerWeek: optNum(newVehicleModel.pricePerWeek),
      pricePerMonth: optNum(newVehicleModel.pricePerMonth),
      available: !!newVehicleModel.available,
      updatedAt: serverTimestamp(),
      createdAt: isUpdateModeModel ? newVehicleModel.createdAt : serverTimestamp(),
      // giữ nguyên: brand, modelCode, batteryCapacity, motorPower, imageUrl, fuelType, vehicleType, vehicleSubType
    };

    try {
      if (isUpdateModeModel && newVehicleModel.id) {
        await updateDoc(doc(db, 'vehicleModels', newVehicleModel.id), toSave);
      } else {
        const docRef = await addDoc(collection(db, 'vehicleModels'), { ...toSave, id: '' });
        await updateDoc(docRef, { id: docRef.id });
      }

      await fetchModels();
      resetForm();
      onSaveComplete?.();
    } catch (err) {
      console.error('❌ Failed to save vehicle model:', err);
      setError('Failed to save vehicle model');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin || (companyId && companyId.trim() !== '')) {
      fetchModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, isAdmin]);

  return {
    // data
    models,
    setModels,

    // form state
    newVehicleModel,
    setNewVehicleModel,

    // actions
    handleChange,
    setVehicleType,
    handleSave,
    setEditModel,
    resetForm,
    fetchModels,

    // ui flags
    isUpdateModeModel,
    setIsUpdateModeModel,
    loading,
    error,

    // select options
    vehicleTypeOptions,
    vehicleSubtypeOptions,
    fuelTypeOptions,

    // helpers
    VEHICLE_SUBTYPE_LABELS, // nếu cần render nhãn nhanh
  };
}
