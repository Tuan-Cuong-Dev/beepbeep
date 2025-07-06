'use client';

import { useState, useEffect } from 'react';
import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

export default function AddRepairShopForm() {
  const { user } = useUser();
  const [form, setForm] = useState<Partial<TechnicianPartner>>({
    type: 'shop',
    name: '',
    phone: '',
    shopName: '',
    shopAddress: '',
    mapAddress: '',
    coordinates: { lat: 0, lng: 0 },
    assignedRegions: [],
    workingHours: [],
    vehicleType: 'motorbike',
    isActive: false,
  });

  const { coords, geocode } = useGeocodeAddress();
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (form.mapAddress) {
      geocode(form.mapAddress);
    }
  }, [form.mapAddress]);

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({ ...prev, coordinates: coords }));
    }
  }, [coords]);

  const handleChange = (field: keyof TechnicianPartner, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.uid || !form.name || !form.phone || !form.shopAddress) return;
    setSubmitting(true);
    try {
      const data: TechnicianPartner = {
        ...form,
        name: form.name!,
        phone: form.phone!,
        shopAddress: form.shopAddress!,
        type: 'shop',
        assignedRegions: form.assignedRegions || [],
        workingHours: form.workingHours || [],
        coordinates: form.coordinates || undefined,
        vehicleType: form.vehicleType || 'motorbike',
        createdBy: user.uid,
        isActive: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        role: 'technician_partner',
        userId: '', // sẽ gán sau khi admin duyệt
      };

      await addDoc(collection(db, 'technicianPartners'), data);

      // Reset và thông báo
      setForm({
        type: 'shop',
        name: '',
        phone: '',
        shopName: '',
        shopAddress: '',
        mapAddress: '',
        coordinates: { lat: 0, lng: 0 },
        assignedRegions: [],
        workingHours: [],
        vehicleType: 'motorbike',
        isActive: false,
      });
      setShowDialog(true);
    } catch (error) {
      console.error('❌ Error submitting technician:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Technician name"
        value={form.name || ''}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Input
        placeholder="Phone number"
        value={form.phone || ''}
        onChange={(e) => handleChange('phone', e.target.value)}
      />
      <Input
        placeholder="Shop name (optional)"
        value={form.shopName || ''}
        onChange={(e) => handleChange('shopName', e.target.value)}
      />
      <Textarea
        placeholder="Shop address"
        value={form.shopAddress || ''}
        onChange={(e) => handleChange('shopAddress', e.target.value)}
      />
      <Textarea
        placeholder="Google Maps formatted address (optional)"
        value={form.mapAddress || ''}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
      />
      <Input
        placeholder="Latitude"
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
        value={form.coordinates?.lng ?? ''}
        onChange={(e) =>
          handleChange('coordinates', {
            ...form.coordinates,
            lng: parseFloat(e.target.value),
          })
        }
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
        {submitting ? 'Submitting...' : 'Submit Repair Shop'}
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
