// 📁 components/contribute/AddRentalShopForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { StationFormValues } from '@/src/lib/stations/stationTypes';
import { db } from '@/src/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

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

  const { coords, geocode } = useGeocodeAddress();
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (form.mapAddress) geocode(form.mapAddress);
  }, [form.mapAddress]);

  useEffect(() => {
    if (coords) {
      const newLocation = `${coords.lat.toFixed(6)}° N, ${coords.lng.toFixed(6)}° E`;
      setForm((prev) => ({ ...prev, geo: coords, location: newLocation }));
    }
  }, [coords]);

  const handleChange = (field: keyof StationFormValues, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.uid || !form.name || !form.displayAddress || !form.location) return;
    setSubmitting(true);
    try {
      const data = {
        ...form,
        companyId: 'contributed',
        status: 'inactive',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'rentalStations'), data);
      setForm({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        geo: undefined,
        contactPhone: '',
        vehicleType: 'motorbike',
      });
      setShowDialog(true);
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
      <select
        className="w-full border rounded px-3 py-2"
        value={form.vehicleType || ''}
        onChange={(e) => handleChange('vehicleType', e.target.value as any)}
      >
        <option value="">Select vehicle type</option>
        <option value="bike">Bike</option>
        <option value="motorbike">Motorbike</option>
        <option value="car">Car</option>
      </select>
      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Rental Shop'}
      </Button>

      <NotificationDialog
        open={showDialog}
        type="success"
        title="Thank you for your contribution!"
        description="We’ve received your submission and will review it shortly."
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
