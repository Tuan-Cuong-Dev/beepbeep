'use client';

import { useState, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useBatteryStations } from '@/src/hooks/useBatteryStations';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

export default function AddBatteryStationForm() {
  const { create, reload } = useBatteryStations();
  const { coords, geocode, loading: geocodeLoading } = useGeocodeAddress();

  const [form, setForm] = useState({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
    coordinates: undefined as { lat: number; lng: number } | undefined,
    vehicleType: 'motorbike' as 'motorbike' | 'car',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (form.mapAddress) geocode(form.mapAddress);
  }, [form.mapAddress]);

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        coordinates: coords,
        location: `${coords.lat.toFixed(5)}° N, ${coords.lng.toFixed(5)}° E`,
      }));
    }
  }, [coords]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.displayAddress || !form.location) return;
    setSubmitting(true);
    try {
      await create({
        ...form,
        isActive: false,
      });
      setForm({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        coordinates: undefined,
        vehicleType: 'motorbike',
      });
      setShowDialog(true);
      reload();
    } catch (err) {
      console.error('❌ Error creating battery station:', err);
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
        value={form.vehicleType}
        onChange={(e) => handleChange('vehicleType', e.target.value as 'motorbike' | 'car')}
      >
        <option value="motorbike">Motorbike</option>
        <option value="car">Car</option>
      </select>

      <Button onClick={handleSubmit} disabled={submitting || geocodeLoading}>
        {submitting ? 'Submitting...' : 'Submit Battery Station'}
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