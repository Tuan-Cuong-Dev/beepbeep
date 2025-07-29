'use client';

import { useState } from 'react';
import { VehicleServiceModel, VehicleType, ServiceType } from '@/src/lib/vehicle-services/vehicleServiceModelTypes';

export function useVehicleServiceModelForm(initial?: Partial<VehicleServiceModel>) {
  const [form, setForm] = useState<Partial<VehicleServiceModel>>(initial || {});

  const handleChange = (field: keyof VehicleServiceModel, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleServiceType = (type: ServiceType) => {
    setForm((prev) => {
      const current = prev.serviceTypes || [];
      const exists = current.includes(type);
      return {
        ...prev,
        serviceTypes: exists
          ? current.filter((t) => t !== type)
          : [...current, type],
      };
    });
  };

  const resetForm = () => {
    setForm({});
  };

  return {
    form,
    setForm,
    handleChange,
    toggleServiceType,
    resetForm,
  };
}
