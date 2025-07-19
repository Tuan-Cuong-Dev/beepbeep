'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc, Timestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

interface Props {
  id: string;
  onClose: () => void;
}

export default function RentalShopEditForm({ id, onClose }: Props) {
  const { t } = useTranslation('common');
  const [station, setStation] = useState<Partial<RentalStation> | null>(null);
  const [saving, setSaving] = useState(false);
  const { coords, geocode } = useGeocodeAddress();

  // Fetch data on mount
  useEffect(() => {
    const fetchStation = async () => {
      const ref = doc(db, 'rentalStations', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setStation(snap.data() as RentalStation);
      }
    };
    fetchStation();
  }, [id]);

  // Auto geocode when mapAddress changes
  const [lastGeocodedAddress, setLastGeocodedAddress] = useState<string | null>(null);

  useEffect(() => {
    if (
      station?.mapAddress &&
      station.mapAddress !== lastGeocodedAddress
    ) {
      geocode(station.mapAddress);
      setLastGeocodedAddress(station.mapAddress);
    }
  }, [station?.mapAddress, lastGeocodedAddress, geocode]);


  // Update coordinates + location string
  useEffect(() => {
    if (coords) {
      const newLocation = `${coords.lat.toFixed(6)}° N, ${coords.lng.toFixed(6)}° E`;
      const geo = new GeoPoint(coords.lat, coords.lng);

      setStation((prev) => ({
        ...prev,
        geo,
        location: newLocation,
      }));
    }
  }, [coords]);

  const handleChange = useCallback((field: keyof RentalStation, value: any) => {
    setStation((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = async () => {
    if (!station) return;
    setSaving(true);
    try {
      const updateData = {
        name: station.name || '',
        displayAddress: station.displayAddress || '',
        mapAddress: station.mapAddress || '',
        location: station.location || '',
        contactPhone: station.contactPhone || '',
        vehicleType: station.vehicleType || 'motorbike',
        geo: station.geo ?? undefined,
        updatedAt: Timestamp.now(),
      };
      await updateDoc(doc(db, 'rentalStations', id), updateData);
      onClose();
    } catch (err) {
      alert(t('rental_shop_edit_form.update_error'));
    } finally {
      setSaving(false);
    }
  };

  if (!station) {
    return <p className="p-4 text-center">{t('loading')}</p>;
  }

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      <StationField
        label={t('rental_shop_edit_form.shop_name')}
        value={station.name}
        onChange={(v) => handleChange('name', v)}
      />
      <StationField
        label={t('rental_shop_edit_form.display_address')}
        value={station.displayAddress}
        onChange={(v) => handleChange('displayAddress', v)}
        textarea
      />
      <StationField
        label={t('rental_shop_edit_form.map_address')}
        value={station.mapAddress}
        onChange={(v) => handleChange('mapAddress', v)}
        textarea
        className="min-h-[180px]"
      />
      <StationField
        label={t('rental_shop_edit_form.location')}
        value={station.location}
        onChange={(v) => handleChange('location', v)}
      />
      <StationField
        label={t('rental_shop_edit_form.phone')}
        value={station.contactPhone}
        onChange={(v) => handleChange('contactPhone', v)}
      />

      {/* Vehicle Type Selector */}
      <div>
        <Label>{t('rental_shop_edit_form.select_vehicle_type')}</Label>
        <select
          className="w-full border rounded px-3 py-2"
          value={station.vehicleType || ''}
          onChange={(e) => handleChange('vehicleType', e.target.value)}
        >
          <option value="">{t('rental_shop_edit_form.select_vehicle_type')}</option>
          <option value="bike">{t('rental_shop_edit_form.vehicle_bike')}</option>
          <option value="motorbike">{t('rental_shop_edit_form.vehicle_motorbike')}</option>
          <option value="car">{t('rental_shop_edit_form.vehicle_car')}</option>
        </select>
      </div>

      {station.geo && (
        <div className="h-48 rounded overflow-hidden border mt-2">
          <MapPreview coords={{ lat: station.geo.latitude, lng: station.geo.longitude }} />
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}

function StationField({
  label,
  value,
  onChange,
  textarea = false,
  className = '',
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  textarea?: boolean;
  className?: string;
}) {
  return (
    <div>
      <Label>{label}</Label>
      {textarea ? (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      ) : (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className={className}
        />
      )}
    </div>
  );
}

