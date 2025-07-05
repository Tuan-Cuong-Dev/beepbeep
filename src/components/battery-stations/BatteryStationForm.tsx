// 📁 components/battery-stations/BatteryStationForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { BatteryStation, VehicleType } from '@/src/lib/batteryStations/batteryStationTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  station?: BatteryStation;
  onSave: (data: Omit<BatteryStation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel?: () => void;
}

export default function BatteryStationForm({ station, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Omit<BatteryStation, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    coordinates: { lat: 0, lng: 0 },
    vehicleType: 'motorbike',
    isActive: true,
  });

  useEffect(() => {
    if (station) {
      const { id, createdAt, updatedAt, ...rest } = station;
      setForm(rest);
    }
  }, [station]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <div className="space-y-4">
      <input
        placeholder="Name"
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
        className="input"
      />
      <input
        placeholder="Display Address"
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
        className="input"
      />
      <input
        placeholder="Map Address"
        value={form.mapAddress || ''}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
        className="input"
      />
      <div className="flex gap-2">
        <input
          placeholder="Lat"
          type="number"
          value={form.coordinates?.lat ?? ''}
          onChange={(e) => handleChange('coordinates', { ...form.coordinates, lat: parseFloat(e.target.value) })}
          className="input"
        />
        <input
          placeholder="Lng"
          type="number"
          value={form.coordinates?.lng ?? ''}
          onChange={(e) => handleChange('coordinates', { ...form.coordinates, lng: parseFloat(e.target.value) })}
          className="input"
        />
      </div>
      <select
        value={form.vehicleType}
        onChange={(e) => handleChange('vehicleType', e.target.value as VehicleType)}
        className="input"
      >
        <option value="motorbike">Motorbike</option>
        <option value="car">Car</option>
      </select>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => handleChange('isActive', e.target.checked)}
        />{' '}
        Active
      </label>
      <div className="flex gap-2">
        <Button onClick={handleSubmit}>Save</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}
