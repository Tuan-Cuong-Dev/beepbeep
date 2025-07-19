'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useBatteryStations } from '@/src/hooks/useBatteryStations';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';

export default function AddBatteryStationForm() {
  const { t } = useTranslation('common');
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
        placeholder={t('battery_station_form.station_name')}
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Textarea
        placeholder={t('battery_station_form.display_address')}
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />
      <Textarea
        className="min-h-[180px]"
        placeholder={t('battery_station_form.map_address')}
        value={form.mapAddress}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
      />
      <Input
        placeholder={t('battery_station_form.location')}
        value={form.location}
        onChange={(e) => handleChange('location', e.target.value)}
      />
      <select
        className="w-full border rounded px-3 py-2"
        value={form.vehicleType}
        onChange={(e) => handleChange('vehicleType', e.target.value as 'motorbike' | 'car')}
      >
        <option value="">{t('battery_station_form.select_vehicle_type')}</option>
        <option value="motorbike">{t('battery_station_form.vehicle_motorbike')}</option>
        <option value="car">{t('battery_station_form.vehicle_car')}</option>
      </select>

      <Button onClick={handleSubmit} disabled={submitting || geocodeLoading}>
        {submitting
          ? t('battery_station_form.submitting')
          : t('battery_station_form.submit_battery_station')}
      </Button>

      <NotificationDialog
        open={showDialog}
        type="success"
        title={t('battery_station_form.thank_you')}
        description={t('battery_station_form.submission_received')}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
