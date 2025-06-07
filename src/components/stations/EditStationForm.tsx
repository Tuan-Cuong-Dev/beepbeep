'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface Props {
  companyId: string;
  editingStation: {
    id: string;
    name: string;
    displayAddress: string;
    mapAddress: string;
    location: string;
  };
  onCancel: () => void;
  onSaved: () => void;
}

export default function EditStationForm({ companyId, editingStation, onCancel, onSaved }: Props) {
  const [form, setForm] = useState(editingStation);
  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({ ...prev, location: `${coords.lat}° N, ${coords.lng}° E` }));
    }
  }, [coords]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress.trim()) geocode(form.mapAddress);
  };

  const handleUpdate = async () => {
    try {
      const { id, ...rest } = form;
      await updateDoc(doc(db, 'rentalStations', id), {
        ...rest,
        companyId,
        updatedAt: new Date(),
      });
      onSaved();
    } catch (err) {
      console.error('❌ Error updating station:', err);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">✏️ Edit Station</h2>
      <Input placeholder="Station Name" value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
      <Input placeholder="Display Address" value={form.displayAddress} onChange={(e) => handleChange('displayAddress', e.target.value)} />
      <Input
        placeholder="Map Address (Google link or full address)"
        value={form.mapAddress}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
        onBlur={handleMapAddressBlur}
      />
      <Input placeholder="Location (auto-filled)" value={form.location} readOnly />

      {loading && <p className="text-sm text-gray-500">Detecting location...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleUpdate} className="bg-[#00d289] text-white hover:bg-[#00b67a]">Save Changes</Button>
      </div>
    </div>
  );
}