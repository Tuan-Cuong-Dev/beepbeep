'use client';

import { useState } from 'react';
import {
  VehicleModel,
  VehicleType,
  FuelType,
} from '@/src/lib/vehicleModels/vehicleModelTypes_new';

/**
 * Hook quản lý state và logic xử lý form VehicleModel
 */
export function useVehicleModelForm(initial?: Partial<VehicleModel>) {
  const [form, setForm] = useState<Partial<VehicleModel>>(initial || { available: true });

  const handleChange = <K extends keyof VehicleModel>(key: K, value: VehicleModel[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleStringChange = (
    key: keyof VehicleModel
  ) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
    }));
  };

  const handleNumberChange = (key: keyof VehicleModel) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      setForm((prev) => ({
        ...prev,
        [key]: isNaN(value) ? undefined : value,
      }));
    };

  const handleSelectChange = <T extends string>(
    key: keyof VehicleModel,
    value: T
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleAvailable = () => {
    setForm((prev) => ({
      ...prev,
      available: !prev.available,
    }));
  };

  const resetForm = () => {
    setForm({ available: true });
  };

  return {
    form,
    setForm,
    handleChange,
    handleStringChange,
    handleNumberChange,
    handleSelectChange,
    toggleAvailable,
    resetForm,
  };
}
