'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { RentalCompany } from '../../../hooks/useRentalData';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';

interface Props {
  editingCompany: RentalCompany | null;
  onSave: (data: Omit<RentalCompany, 'id'>) => void;
  onCancel: () => void;
}

export default function RentalCompanyForm({ editingCompany, onSave, onCancel }: Props) {
  const [form, setForm] = useState<Omit<RentalCompany, 'id'>>({
    name: '',
    email: '',
    phone: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
  });

  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({ ...prev, location: `${coords.lat}° N, ${coords.lng}° E` }));
    }
  }, [coords]);

  useEffect(() => {
    if (editingCompany) {
      const { id, ...rest } = editingCompany;
      setForm(rest);
    }
  }, [editingCompany]);

  const handleChange = (key: keyof typeof form, value: string) => {
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
        placeholder="Company Name"
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Input
        placeholder="Email"
        value={form.email}
        onChange={(e) => handleChange('email', e.target.value)}
      />
      <Input
        placeholder="Phone"
        value={form.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
      />
      <Input
        placeholder="Display Address"
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />
      <Input
        placeholder="Map Address (Google link or full address)"
        value={form.mapAddress}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
        onBlur={handleMapAddressBlur}
      />
      <Input
        placeholder="Location (auto-filled)"
        value={form.location}
        readOnly
      />

      {loading && <p className="text-sm text-gray-500">Detecting location...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={() => onSave(form)}>{editingCompany ? 'Update' : 'Add'} Company</Button>
        {editingCompany && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </div>
  );
}