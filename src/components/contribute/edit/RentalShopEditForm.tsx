'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, Timestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { Textarea } from '@/src/components/ui/textarea';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

export default function RentalShopEditForm({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { t } = useTranslation('common');
  const [station, setStation] = useState<Partial<RentalStation> | null>(null);
  const [saving, setSaving] = useState(false);
  const { coords, geocode } = useGeocodeAddress();

  useEffect(() => {
    const fetch = async () => {
      const ref = doc(db, 'rentalStations', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setStation(snap.data() as RentalStation);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (station?.mapAddress) geocode(station.mapAddress);
  }, [station?.mapAddress]);

  useEffect(() => {
    if (coords) {
      const newLocation = `${coords.lat.toFixed(6)}° N, ${coords.lng.toFixed(6)}° E`;
      const geo = new GeoPoint(coords.lat, coords.lng); // ✅ chuyển đổi chính xác

      setStation((prev) => ({
        ...prev,
        geo,
        location: newLocation,
      }));
    }
  }, [coords]);


  const handleChange = (field: keyof RentalStation, value: any) => {
    setStation((prev) => ({ ...prev, [field]: value }));
  };

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
      alert(t('rental_shop_edit_form.update_error') || '❌ Lỗi khi cập nhật điểm cho thuê.');
    } finally {
      setSaving(false);
    }
  };

  if (!station) return <p className="p-4 text-center">{t('loading') || 'Đang tải dữ liệu...'}</p>;

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      <div>
        <Label>{t('rental_shop_edit_form.shop_name')}</Label>
        <Input
          value={station.name || ''}
          onChange={(e) => handleChange('name', e.target.value)}
        />
      </div>

      <div>
        <Label>{t('rental_shop_edit_form.display_address')}</Label>
        <Textarea
          value={station.displayAddress || ''}
          onChange={(e) => handleChange('displayAddress', e.target.value)}
        />
      </div>

      <div>
        <Label>{t('rental_shop_edit_form.map_address')}</Label>
        <Textarea
          value={station.mapAddress || ''}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
        />
      </div>

      <div>
        <Label>{t('rental_shop_edit_form.location')}</Label>
        <Input
          value={station.location || ''}
          onChange={(e) => handleChange('location', e.target.value)}
        />
      </div>

      <div>
        <Label>{t('rental_shop_edit_form.phone')}</Label>
        <Input
          value={station.contactPhone || ''}
          onChange={(e) => handleChange('contactPhone', e.target.value)}
        />
      </div>

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
