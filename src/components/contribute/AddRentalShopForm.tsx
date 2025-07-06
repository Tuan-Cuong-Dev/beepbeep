// 📁 components/contribute/AddRentalShopForm.tsx
'use client';

import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { StationFormValues } from '@/src/lib/stations/stationTypes';
import { db } from '@/src/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';

export default function AddRentalShopForm() {
  const { user } = useUser();
  const [form, setForm] = useState<StationFormValues>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
    geo: undefined,
    contactPhone: '',
    vehicleType: 'motorbike',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof StationFormValues, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.uid || !form.name || !form.displayAddress || !form.location) return;
    setSubmitting(true);
    try {
      const data = {
        ...form,
        companyId: 'contributed', // gán cố định hoặc xử lý sau
        status: 'inactive',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'rentalStations'), data);
      setSuccess(true);
      setForm({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        geo: undefined,
        contactPhone: '',
        vehicleType: 'motorbike',
      });
    } catch (err) {
      console.error('❌ Error adding rental shop:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Shop name"
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Textarea
        placeholder="Display address"
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />
      <Textarea
        placeholder="Google Maps address (optional)"
        value={form.mapAddress}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
      />
      <Input
        placeholder="Coordinates (e.g. 16.07° N, 108.22° E)"
        value={form.location}
        onChange={(e) => handleChange('location', e.target.value)}
      />
      <Input
        placeholder="Phone number (optional)"
        value={form.contactPhone}
        onChange={(e) => handleChange('contactPhone', e.target.value)}
      />
      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Rental Shop'}
      </Button>

      {success && <p className="text-green-600">Rental shop submitted for review!</p>}
    </div>
  );
}
