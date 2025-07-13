'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { RentalStation } from '@/src/hooks/useRentalData';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';

interface Props {
  companies: { id: string; name: string }[];
  editingStation: RentalStation | null;
  onSave: (data: Omit<RentalStation, 'id'>) => void;
  onCancel: () => void;
}

export default function RentalStationForm({ companies, editingStation, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Omit<RentalStation, 'id'>>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
    totalEbikes: 0,
    companyId: '',
    contactPhone: '', // ✅ Thêm trường liên hệ
  });

  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        location: `${coords.lat}° N, ${coords.lng}° E`,
      }));
    }
  }, [coords]);

  useEffect(() => {
    if (editingStation) {
      const { id, ...rest } = editingStation;
      setForm({ ...rest, contactPhone: rest.contactPhone || '' });
    }
  }, [editingStation]);

  const handleChange = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress.trim()) {
      geocode(form.mapAddress);
    }
  };

  return (
    <div className="hidden md:space-y-3 md:block">
      <Input
        placeholder="Station name"
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Input
        placeholder="Display address"
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />
      <Input
        placeholder="Google Maps link"
        value={form.mapAddress}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
        onBlur={handleMapAddressBlur}
      />
      <Input
        placeholder="Location (lat° N, lng° E)"
        value={form.location}
        readOnly
      />
      {loading && <p className="text-sm text-gray-500">Detecting coordinates...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Input
        placeholder="Contact Phone"
        value={form.contactPhone}
        onChange={(e) => handleChange('contactPhone', e.target.value)}
      />

      <select
        className="border rounded px-3 py-2 w-full"
        value={form.companyId}
        onChange={(e) => handleChange('companyId', e.target.value)}
      >
        <option value="">Select company</option>
        {companies.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>

      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}>
          {editingStation ? 'Update' : 'Add'} Station
        </Button>
        {editingStation && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
