// 📁 components/report-public-issue/PublicIssueForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { db } from '@/src/firebaseConfig';
import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { PublicIssue } from '@/src/lib/publicIssue/publicIssueTypes';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';

export default function PublicIssueForm() {
  const { user } = useUser();
  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();

  const [form, setForm] = useState<Omit<PublicIssue, 'id' | 'status' | 'createdAt'>>({
    customerName: '',
    phone: '',
    issueDescription: '',
    vehicleId: '',
    reportedBy: user?.id || '',
    location: {
      mapAddress: '',
      coordinates: '',
      issueAddress: '',
    },
  });

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleGeocode = () => {
    if (form.location.mapAddress?.trim()) {
      geocode(form.location.mapAddress);
    }
  };

  useEffect(() => {
    if (coords) {
      handleChange('location', {
        ...form.location,
        coordinates: `${coords.lat},${coords.lng}`,
      });
    }
  }, [coords]);

  const handleSubmit = async () => {
    if (!form.issueDescription || !form.location.issueAddress) return alert('Please fill all required fields');

    const data: PublicIssue = {
      ...form,
      status: 'pending',
      createdAt: Timestamp.now(),
    };

    await addDoc(collection(db, 'publicVehicleIssues'), data);
    alert('Issue reported successfully');
    setForm({
      customerName: '',
      phone: '',
      issueDescription: '',
      vehicleId: '',
      reportedBy: user?.uid || '',
      location: { mapAddress: '', coordinates: '', issueAddress: '' },
    });
  };

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h2 className="text-xl font-bold">📞 Report a Public Vehicle Issue</h2>

      <Input placeholder="Customer Name" value={form.customerName} onChange={e => handleChange('customerName', e.target.value)} />
      <Input placeholder="Phone Number" value={form.phone} onChange={e => handleChange('phone', e.target.value)} />
      <Input placeholder="Vehicle ID (optional)" value={form.vehicleId} onChange={e => handleChange('vehicleId', e.target.value)} />
      <Textarea placeholder="Issue Description" value={form.issueDescription} onChange={e => handleChange('issueDescription', e.target.value)} />

      <Textarea
        placeholder="Map Address (Google Maps link or description)"
        value={form.location.mapAddress}
        onChange={e => handleChange('location', { ...form.location, mapAddress: e.target.value })}
        onBlur={handleGeocode}
      />
      <Input
        placeholder="Coordinates (lat,lng)"
        value={form.location.coordinates}
        readOnly={!!coords}
        onChange={e => handleChange('location', { ...form.location, coordinates: e.target.value })}
      />
      <Input
        placeholder="Physical Address where the issue occurs"
        value={form.location.issueAddress}
        onChange={e => handleChange('location', { ...form.location, issueAddress: e.target.value })}
      />

      {coords && (
        <>
          <p className="text-sm text-gray-600">
            📌 Detected: {coords.lat}° N, {coords.lng}° E
          </p>
          <iframe
            title="Map Preview"
            width="100%"
            height="200"
            className="rounded-xl"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=16&output=embed`}
          />
        </>
      )}

      {geoError && <p className="text-sm text-red-500">⚠️ {geoError}</p>}

      <Button onClick={handleSubmit} disabled={geoLoading}>
        {geoLoading ? 'Processing location...' : 'Submit Issue'}
      </Button>
    </div>
  );
}
