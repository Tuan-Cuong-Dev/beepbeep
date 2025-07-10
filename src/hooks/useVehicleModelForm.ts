// Tạo ngày 10/07/2025
'use client';

import { useState } from 'react';
import { VehicleModel, VehicleType } from '@/src/lib/vehicleModels/vehicleModelTypes_new';

export function useVehicleModelForm(initial?: Partial<VehicleModel>) {
  const [form, setForm] = useState<Partial<VehicleModel>>(initial || { available: true });

  const handleChange = <K extends keyof VehicleModel>(key: K, value: VehicleModel[K]) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNumberChange = (key: keyof VehicleModel) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    setForm((prev) => ({
      ...prev,
      [key]: isNaN(value) ? undefined : value,
    }));
  };

  const handleStringChange = (key: keyof VehicleModel) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({
      ...prev,
      [key]: e.target.value,
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
    handleNumberChange,
    handleStringChange,
    toggleAvailable,
    resetForm,
  };
}
