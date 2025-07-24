'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { BatteryChargingStation, VehicleType } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';

interface Props {
  station?: BatteryChargingStation;
  onSave: (data: Omit<BatteryChargingStation, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel?: () => void;
  onSaveComplete?: () => void;
}

export default function BatteryChargingStationForm({
  station,
  onSave,
  onCancel,
  onSaveComplete,
}: Props) {
  const [form, setForm] = useState<Omit<BatteryChargingStation, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    coordinates: { lat: 0, lng: 0 },
    vehicleType: 'motorbike',
    isActive: true,
  });

  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (station) {
      const { id, createdAt, updatedAt, ...rest } = station;
      setForm(rest);
    }
  }, [station]);

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        coordinates: coords,
      }));
    }
  }, [coords]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress?.trim()) geocode(form.mapAddress);
  };

  const coordsForMap = form.coordinates?.lat && form.coordinates?.lng ? form.coordinates : null;

  const handleSubmit = async () => {
    try {
      await onSave(form);
      if (onSaveComplete) onSaveComplete();
    } catch (err) {
      console.error('Failed to save battery charging station:', err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">🔋 Battery Charging Station Form</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          placeholder="Station Name"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <Input
          placeholder="Display Address"
          value={form.displayAddress}
          onChange={(e) => handleChange('displayAddress', e.target.value)}
        />
        <Input
          placeholder="Map Address (Google Maps link or full address)"
          value={form.mapAddress || ''}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
          onBlur={handleMapAddressBlur}
          className="md:col-span-2"
        />
        <Input
          placeholder="Latitude"
          type="number"
          value={form.coordinates?.lat ?? ''}
          onChange={(e) =>
            handleChange('coordinates', {
              ...form.coordinates,
              lat: parseFloat(e.target.value),
            })
          }
        />
        <Input
          placeholder="Longitude"
          type="number"
          value={form.coordinates?.lng ?? ''}
          onChange={(e) =>
            handleChange('coordinates', {
              ...form.coordinates,
              lng: parseFloat(e.target.value),
            })
          }
        />
        <select
          value={form.vehicleType}
          onChange={(e) => handleChange('vehicleType', e.target.value as VehicleType)}
          className="border border-gray-300 rounded px-3 py-2"
        >
          <option value="motorbike">Motorbike</option>
          <option value="car">Car</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => handleChange('isActive', e.target.checked)}
          />{' '}
          Active
        </label>
      </div>

      {loading && <p className="text-sm text-gray-500">📍 Detecting location...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {coordsForMap && (
        <iframe
          title="Map Preview"
          width="100%"
          height="200"
          className="rounded-xl"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps?q=${coordsForMap.lat},${coordsForMap.lng}&hl=vi&z=16&output=embed`}
        ></iframe>
      )}

      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          className="bg-[#00d289] hover:bg-[#00b67a] text-white"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
