// 📁 components/contribute/AddBatteryStationForm.tsx
'use client';

import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';

export default function AddBatteryStationForm() {
  const { user } = useUser();
  const [form, setForm] = useState({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
    vehicleType: 'motorbike' as 'motorbike' | 'car',
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.displayAddress || !form.location) return;
    setSubmitting(true);
    try {
      const data = {
        name: form.name,
        displayAddress: form.displayAddress,
        mapAddress: form.mapAddress,
        coordinates: undefined,
        vehicleType: form.vehicleType,
        isActive: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'batteryStations'), data);
      setSuccess(true);
      setForm({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        vehicleType: 'motorbike',
      });
    } catch (err) {
      console.error('❌ Error adding battery station:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Station name"
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
      <select
        className="w-full border rounded px-3 py-2"
        value={form.vehicleType || ''}
        onChange={(e) => handleChange('vehicleType', e.target.value as 'motorbike' | 'car')}
      >
        <option value="">Select vehicle type</option>
        <option value="motorbike">Motorbike</option>
        <option value="car">Car</option>
      </select>

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Battery Station'}
      </Button>

      {success && <p className="text-green-600">Battery station submitted for review!</p>}
    </div>
  );
}