'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Station, StationFormValues } from '@/src/lib/stations/stationTypes';
import { useTranslation } from 'react-i18next';

interface Props {
  companyId: string;
  editingStation: Station;
  onCancel: () => void;
  onSaved: () => void;
}

export default function EditStationForm({
  companyId,
  editingStation,
  onCancel,
  onSaved,
}: Props) {
  const { t } = useTranslation('common');

  const [form, setForm] = useState<StationFormValues>({
    name: editingStation.name,
    displayAddress: editingStation.displayAddress,
    mapAddress: editingStation.mapAddress,
    location: editingStation.location,
    geo: editingStation.geo,
    contactPhone: editingStation.contactPhone ?? '',
  });

  const [status, setStatus] = useState<'active' | 'inactive'>(
    editingStation.status ?? 'active'
  );

  const { coords, geocode, loading, error } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setForm((prev) => ({
        ...prev,
        geo: coords,
        location: `${coords.lat}° N, ${coords.lng}° E`,
      }));
    }
  }, [coords]);

  const handleChange = (key: keyof StationFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleMapAddressBlur = () => {
    if (form.mapAddress.trim()) geocode(form.mapAddress);
  };

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'rentalStations', editingStation.id), {
        ...form,
        companyId,
        status,
        updatedAt: serverTimestamp(),
      });
      onSaved();
    } catch (err) {
      console.error('❌ Error updating station:', err);
    }
  };

  const getMapCoords = (): { lat: string; lng: string } | null => {
    const match = form.location.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
    if (!match) return null;
    return { lat: match[1], lng: match[3] };
  };

  const coordsForMap = getMapCoords();

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">✏️ {t('rental_station_form.edit_title')}</h2>

      <Input
        placeholder={t('rental_station_form.station_name')}
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Input
        placeholder={t('rental_station_form.display_address')}
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />
      <Input
        placeholder={t('rental_station_form.map_address')}
        value={form.mapAddress}
        onChange={(e) => handleChange('mapAddress', e.target.value)}
        onBlur={handleMapAddressBlur}
      />
      <Input
        placeholder={t('station_form.contact_phone')}
        value={form.contactPhone}
        onChange={(e) => handleChange('contactPhone', e.target.value)}
      />
      <Input
        placeholder={t('rental_station_form.coordinates')}
        value={form.location}
        readOnly
      />

      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">
          {t('rental_station_form.status_label')}:
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        >
          <option value="active">✅ {t('rental_station_form.status_active')}</option>
          <option value="inactive">🚫 {t('rental_station_form.status_inactive')}</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">{t('rental_station_form.detecting_coords')}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {coordsForMap && (
        <iframe
          title="Map Preview"
          width="100%"
          height="200"
          className="rounded-xl"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          src={`https://www.google.com/maps?q=${coordsForMap.lat},${coordsForMap.lng}&hl=vi&z=16&output=embed`}
        ></iframe>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onCancel}>
          {t('rental_station_form.actions.cancel')}
        </Button>
        <Button
          onClick={handleUpdate}
          className="bg-[#00d289] text-white hover:bg-[#00b67a]"
        >
          {t('rental_station_form.actions.save_changes')}
        </Button>
      </div>
    </div>
  );
}
