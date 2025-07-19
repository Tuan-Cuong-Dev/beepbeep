'use client';

import { useState, useEffect } from 'react';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { StationFormValues } from '@/src/lib/stations/stationTypes';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';

export default function AddRentalShopForm() {
  const { t } = useTranslation('common');
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
        createdBy: user.uid, // ✅ thêm dòng này
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
        placeholder={t('rental_shop_form.shop_name')}
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Textarea
        placeholder={t('rental_shop_form.display_address')}
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />
      <Textarea
        placeholder={t('rental_shop_form.map_address')}
        value={form.mapAddress}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
      />
      <Input
        placeholder={t('rental_shop_form.location')}
        value={form.location}
        onChange={(e) => handleChange('location', e.target.value)}
      />
      <Input
        placeholder={t('rental_shop_form.phone')}
        value={form.contactPhone}
        onChange={(e) => handleChange('contactPhone', e.target.value)}
      />
      <select
        className="w-full border rounded px-3 py-2"
        value={form.vehicleType || ''}
        onChange={(e) => handleChange('vehicleType', e.target.value as any)}
      >
        <option value="">{t('rental_shop_form.select_vehicle_type')}</option>
        <option value="bike">{t('rental_shop_form.vehicle_bike')}</option>
        <option value="motorbike">{t('rental_shop_form.vehicle_motorbike')}</option>
        <option value="car">{t('rental_shop_form.vehicle_car')}</option>
      </select>

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting
          ? t('rental_shop_form.submitting')
          : t('rental_shop_form.submit_rental_shop')}
      </Button>

      <NotificationDialog
        open={showDialog}
        type="success"
        title={t('rental_shop_form.thank_you')}
        description={t('rental_shop_form.submission_received')}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
