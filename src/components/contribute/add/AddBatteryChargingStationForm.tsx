'use client';

import { useState, useEffect } from 'react';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useContributions } from '@/src/hooks/useContributions';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';

type FormState = Omit<BatteryChargingStation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
  location: string;
};

const defaultForm: FormState = {
  name: '',
  displayAddress: '',
  mapAddress: '',
  phone: '',
  vehicleType: 'motorbike',
  description: '',
  isActive: false,
  location: '',
  coordinates: undefined,
};

export default function AddBatteryChargingStationForm() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const { coords, geocode } = useGeocodeAddress();
  const { submitContribution } = useContributions();

  const [form, setForm] = useState<FormState>(defaultForm);
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
        location: `${coords.lat.toFixed(6)}° N, ${coords.lng.toFixed(6)}° E`,
      }));
    }
  }, [coords]);

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user?.uid || !form.name || !form.displayAddress || !form.mapAddress || !form.phone) return;

    setSubmitting(true);
    try {
      const data = {
        ...form,
        isActive: false,
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'batteryChargingStations'), data);
      await submitContribution('battery_charging_station', data);

      setForm(defaultForm);
      setShowDialog(true);
    } catch (err) {
      console.error('Error adding battery charging station:', err);
    } finally {
      setSubmitting(false);
    }
  };

return (
  <div className="space-y-4">
    {/* THÔNG TIN CƠ BẢN */}
    <h3 className="font-semibold text-lg">{t('add_battery_charging_station_form.section.basic_info')}</h3>
    <Input placeholder={t('add_battery_charging_station_form.station_name')} value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
    <Textarea placeholder={t('add_battery_charging_station_form.display_address')} value={form.displayAddress} onChange={(e) => handleChange('displayAddress', e.target.value)} />
    <Textarea className="min-h-[180px]" placeholder={t('add_battery_charging_station_form.map_address')} value={form.mapAddress} onChange={(e) => handleChange('mapAddress', e.target.value)} />
    <Input placeholder={t('add_battery_charging_station_form.location')} value={form.location} readOnly />
    <Input placeholder={t('add_battery_charging_station_form.phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />

    {/* MÔ TẢ & PHÂN LOẠI */}
    <h3 className="font-semibold text-lg mt-6">{t('add_battery_charging_station_form.section.details')}</h3>
    <Textarea className="min-h-[180px]" placeholder={t('add_battery_charging_station_form.description')} value={form.description} onChange={(e) => handleChange('description', e.target.value)} />
    <select className="w-full border rounded px-3 py-2" value={form.vehicleType} onChange={(e) => handleChange('vehicleType', e.target.value as 'motorbike' | 'car')}>
      <option value="motorbike">{t('add_battery_charging_station_form.vehicle_type.motorbike')}</option>
      <option value="car">{t('add_battery_charging_station_form.vehicle_type.car')}</option>
    </select>

    {/* NÚT GỬI */}
    <Button onClick={handleSubmit} disabled={submitting}>
      {submitting ? t('add_battery_charging_station_form.submitting') : t('add_battery_charging_station_form.submit')}
    </Button>

    <NotificationDialog
      open={showDialog}
      type="success"
      title={t('add_battery_charging_station_form.success_title')}
      description={t('add_battery_charging_station_form.success_description')}
      onClose={() => setShowDialog(false)}
    />
  </div>
);

}
