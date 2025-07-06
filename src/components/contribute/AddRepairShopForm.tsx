// 📁 components/contribute/AddRepairShopForm.tsx
'use client';

import { useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useUser } from '@/src/context/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';

export default function AddRepairShopForm() {
  const { user } = useUser();
  const [form, setForm] = useState<Partial<TechnicianPartner>>({
    type: 'shop',
    name: '',
    phone: '',
    shopName: '',
    shopAddress: '',
    mapAddress: '',
    coordinates: undefined,
    assignedRegions: [],
    workingHours: [],
    isActive: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof TechnicianPartner, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.uid || !form.name || !form.phone || !form.shopAddress) return;
    setSubmitting(true);
    try {
      const { name, phone, shopAddress, type } = form;
        if (!name || !phone || !shopAddress || !type) return;

        const data: TechnicianPartner = {
        ...form,
        name,
        phone,
        shopAddress,
        type,
        assignedRegions: form.assignedRegions || [], // ✅ sửa lỗi
        workingHours: form.workingHours || [],        // nếu cần
        coordinates: form.coordinates || undefined,
        createdBy: user.uid,
        isActive: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        role: 'technician_partner',
        userId: '',
        };


      await addDoc(collection(db, 'technicianPartners'), data);
      setSuccess(true);
      setForm({
        type: 'shop',
        name: '',
        phone: '',
        shopName: '',
        shopAddress: '',
        mapAddress: '',
        coordinates: undefined,
        assignedRegions: [],
        workingHours: [],
        isActive: false,
      });
    } catch (error) {
      console.error('Error submitting form:', error);
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

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? 'Submitting...' : 'Submit Repair Shop'}
      </Button>

      {success && <p className="text-green-600">Repair shop submitted for review!</p>}
    </div>
  );
}
