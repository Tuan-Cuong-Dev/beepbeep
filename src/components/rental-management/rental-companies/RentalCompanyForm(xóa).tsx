// Form dành riêng cho từng ID 
'use client';

import { useEffect, useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { RentalCompany } from '@/src/lib/rentalCompanies/rentalCompaniesTypes';

export type RentalCompanyFormData = {
  name: string;
  email: string;
  phone: string;
  displayAddress: string;
  mapAddress: string;
  location: string;
};

interface Props {
  editingCompany: RentalCompany | null;
  onSave: (data: RentalCompanyFormData) => Promise<void>;
  onCancel: () => void;
}

export default function RentalCompanyForm({ editingCompany, onSave, onCancel }: Props) {
  const [form, setForm] = useState<RentalCompanyFormData>({
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
      setForm((prev) => ({
        ...prev,
        location: `${coords.lat}° N, ${coords.lng}° E`,
      }));
    }
  }, [coords]);

  useEffect(() => {
    if (editingCompany) {
      const { id, businessType, ownerId, createdAt, updatedAt, ...rest } = editingCompany;
      setForm(rest);
    }
  }, [editingCompany]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    onSave(form);
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress.trim()) {
      geocode(form.mapAddress);
    }
  };

  return (
    <div className="hidden md:space-y-5 md:block">
      <div className="grid gap-4">
        <div>
          <Label>Company Name</Label>
          <Input value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
        </div>
        <div>
          <Label>Email</Label>
          <Input value={form.email} onChange={(e) => handleChange('email', e.target.value)} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />
        </div>
        <div>
          <Label>Display Address</Label>
          <Input value={form.displayAddress} onChange={(e) => handleChange('displayAddress', e.target.value)} />
        </div>
        <div>
          <Label>Map Address (Google link or full address)</Label>
          <Input
            value={form.mapAddress}
            onChange={(e) => handleChange('mapAddress', e.target.value)}
            onBlur={handleMapAddressBlur}
          />
        </div>
        <div>
          <Label>Auto Location (lat, lng)</Label>
          <Input value={form.location} readOnly />
        </div>
      </div>

      {loading && <p className="text-sm text-gray-500">📍 Detecting location...</p>}
      {error && <p className="text-sm text-red-500">⚠️ {error}</p>}

      <div className="flex justify-end gap-4 pt-4">
        <Button onClick={handleSubmit} className="bg-[#00d289] text-white hover:bg-[#00b67a]">
          {editingCompany ? 'Update' : 'Add'} Company
        </Button>
        {editingCompany && (
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
