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
import { useTranslation } from 'react-i18next';
import { useContributions } from '@/src/hooks/useContributions'; 

export default function AddRepairShopForm() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const { coords, geocode } = useGeocodeAddress();
  const { submitContribution } = useContributions();

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

  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (form.mapAddress) geocode(form.mapAddress);
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
        userId: '',
      };

      // ➕ B1. Tạo technician partner
      await addDoc(collection(db, 'technicianPartners'), data);

      // ➕ B2. Ghi nhận đóng góp
      await submitContribution('repair_station', data);

      // ➕ B3. Reset form & mở thông báo
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
      console.error('❌ Error submitting repair shop:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder={t('repair_shop_form.technician_name')}
        value={form.name || ''}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Input
        placeholder={t('repair_shop_form.phone_number')}
        value={form.phone || ''}
        onChange={(e) => handleChange('phone', e.target.value)}
      />
      <Input
        placeholder={t('repair_shop_form.shop_name_optional')}
        value={form.shopName || ''}
        onChange={(e) => handleChange('shopName', e.target.value)}
      />
      <Textarea
        placeholder={t('repair_shop_form.shop_address')}
        value={form.shopAddress || ''}
        onChange={(e) => handleChange('shopAddress', e.target.value)}
      />
      <Textarea
        className="min-h-[180px]"
        placeholder={t('repair_shop_form.map_address')}
        value={form.mapAddress || ''}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
      />
      <Input
        placeholder={t('repair_shop_form.latitude')}
        value={form.coordinates?.lat ?? ''}
        onChange={(e) =>
          handleChange('coordinates', {
            ...form.coordinates,
            lat: parseFloat(e.target.value),
          })
        }
      />
      <Input
        placeholder={t('repair_shop_form.longitude')}
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
        <option value="">{t('repair_shop_form.select_vehicle_type')}</option>
        <option value="bike">{t('repair_shop_form.vehicle_bike')}</option>
        <option value="motorbike">{t('repair_shop_form.vehicle_motorbike')}</option>
        <option value="car">{t('repair_shop_form.vehicle_car')}</option>
      </select>

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? t('repair_shop_form.submitting') : t('repair_shop_form.submit_repair_shop')}
      </Button>

      <NotificationDialog
        open={showDialog}
        type="success"
        title={t('repair_shop_form.thank_you')}
        description={t('repair_shop_form.submission_received')}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
