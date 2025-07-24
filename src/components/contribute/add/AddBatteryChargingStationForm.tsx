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

const initialFormState = {
  name: '',
  displayAddress: '',
  mapAddress: '',
  phone: '',
  vehicleType: 'motorbike',
  placeType: 'cafe',
  chargingPorts: undefined,
  chargingPowerKW: undefined,
  chargingStandard: '',
  openHours: '08:00 - 22:00',
  pricingNotes: '',
  pricingOptions: {},
  comboPackages: [] as string[],
  additionalFeePolicy: '',
  offersPortableCharger: false,
  restAreaAvailable: false,
  freeDrinks: false,
  foodMenu: [] as string[],
  drinkMenu: [] as string[],
  geo: undefined as { lat: number; lng: number } | undefined,
  location: '',
};

const arrayFields = ['comboPackages', 'foodMenu', 'drinkMenu'] as const;

const fieldLabelMap = {
  comboPackages: 'add_battery_charging_station_form.comboPackages',
  foodMenu: 'add_battery_charging_station_form.foodMenu',
  drinkMenu: 'add_battery_charging_station_form.drinkMenu',
} as const;

const fieldPlaceholderMap = {
  comboPackages: 'add_battery_charging_station_form.add_combo',
  foodMenu: 'add_battery_charging_station_form.add_food_item',
  drinkMenu: 'add_battery_charging_station_form.add_drink_item',
} as const;

export default function AddBatteryChargingStationForm() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const { coords, geocode } = useGeocodeAddress();
  const { submitContribution } = useContributions();

  const [form, setForm] = useState(initialFormState);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (form.mapAddress) geocode(form.mapAddress);
  }, [form.mapAddress]);

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        geo: coords,
        location: `${coords.lat.toFixed(6)}° N, ${coords.lng.toFixed(6)}° E`,
      }));
    }
  }, [coords]);

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field: (typeof arrayFields)[number], value: string) => {
    if (!value.trim()) return;
    setForm((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), value.trim()],
    }));
  };

  const handleArrayRemove = (field: (typeof arrayFields)[number], index: number) => {
    setForm((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!user?.uid || !form.name || !form.displayAddress || !form.location || !form.phone) return;

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

      setForm(initialFormState);
      setShowDialog(true);
    } catch (err) {
      console.error('Error adding charging station:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input placeholder={t('add_battery_charging_station_form.station_name')} value={form.name} onChange={(e) => handleChange('name', e.target.value)} />
      <Textarea placeholder={t('add_battery_charging_station_form.display_address')} value={form.displayAddress} onChange={(e) => handleChange('displayAddress', e.target.value)} />
      <Textarea placeholder={t('add_battery_charging_station_form.map_address')} value={form.mapAddress} onChange={(e) => handleChange('mapAddress', e.target.value)} />
      <Input placeholder={t('add_battery_charging_station_form.location')} value={form.location} readOnly />
      <Input placeholder={t('add_battery_charging_station_form.phone')} value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} />

      <select className="w-full border rounded px-3 py-2" value={form.vehicleType} onChange={(e) => handleChange('vehicleType', e.target.value)}>
        <option value="motorbike">{t('add_battery_charging_station_form.vehicle_type.motorbike')}</option>
        <option value="car">{t('add_battery_charging_station_form.vehicle_type.car')}</option>
      </select>

      <select className="w-full border rounded px-3 py-2" value={form.placeType} onChange={(e) => handleChange('placeType', e.target.value)}>
        <option value="cafe">{t('add_battery_charging_station_form.place_type.cafe')}</option>
        <option value="restaurant">{t('add_battery_charging_station_form.place_type.restaurant')}</option>
        <option value="shop">{t('add_battery_charging_station_form.place_type.shop')}</option>
        <option value="home">{t('add_battery_charging_station_form.place_type.home')}</option>
      </select>

      <Input type="number" placeholder={t('add_battery_charging_station_form.charging_ports')} value={form.chargingPorts ?? ''} onChange={(e) => handleChange('chargingPorts', parseInt(e.target.value) || undefined)} />
      <Input type="number" placeholder={t('add_battery_charging_station_form.charging_power_kw')} value={form.chargingPowerKW ?? ''} onChange={(e) => handleChange('chargingPowerKW', parseFloat(e.target.value) || undefined)} />
      <Input placeholder={t('add_battery_charging_station_form.charging_standard')} value={form.chargingStandard} onChange={(e) => handleChange('chargingStandard', e.target.value)} />
      <Input placeholder={t('add_battery_charging_station_form.open_hours')} value={form.openHours} onChange={(e) => handleChange('openHours', e.target.value)} />
      <Textarea placeholder={t('add_battery_charging_station_form.pricing_notes')} value={form.pricingNotes} onChange={(e) => handleChange('pricingNotes', e.target.value)} />
      <Input placeholder={t('add_battery_charging_station_form.additional_fee_policy')} value={form.additionalFeePolicy} onChange={(e) => handleChange('additionalFeePolicy', e.target.value)} />

      <div className="grid grid-cols-2 gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.offersPortableCharger} onChange={(e) => handleChange('offersPortableCharger', e.target.checked)} />
          {t('add_battery_charging_station_form.offers_portable_charger')}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.restAreaAvailable} onChange={(e) => handleChange('restAreaAvailable', e.target.checked)} />
          {t('add_battery_charging_station_form.rest_area_available')}
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={form.freeDrinks} onChange={(e) => handleChange('freeDrinks', e.target.checked)} />
          {t('add_battery_charging_station_form.free_drinks')}
        </label>
      </div>

      {arrayFields.map((field) => (
        <div key={field} className="space-y-1">
          <label className="font-semibold text-sm">{t(fieldLabelMap[field])}</label>
          {(form[field] as string[]).map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input value={item} readOnly />
              <Button size="sm" variant="ghost" onClick={() => handleArrayRemove(field, idx)}>❌</Button>
            </div>
          ))}
          <Input
            placeholder={t(fieldPlaceholderMap[field])}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const value = (e.target as HTMLInputElement).value;
                handleArrayChange(field, value);
                (e.target as HTMLInputElement).value = '';
              }
            }}
          />
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting
          ? t('add_battery_charging_station_form.submitting')
          : t('add_battery_charging_station_form.submit')}
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
