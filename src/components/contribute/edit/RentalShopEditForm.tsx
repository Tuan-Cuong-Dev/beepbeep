// components/rental-stations/RentalShopEditForm.tsx
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';
import { doc, getDoc, updateDoc, Timestamp, GeoPoint } from 'firebase/firestore';

import { db } from '@/src/firebaseConfig';
import type { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';

import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

interface Props {
  id: string;
  onClose: () => void;
}

/* =========== Helpers =========== */

type LatLng = { lat: number; lng: number };

const parseLatLngPair = (s?: string): LatLng | null => {
  if (!s) return null;
  const m = s.match(/(-?\d+(\.\d+)?)\D+(-?\d+(\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

const extractLatLngFromGMapUrl = (url?: string): LatLng | null => {
  if (!url) return null;
  try {
    const at = url.match(/@(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
    if (at) {
      const lat = parseFloat(at[1]);
      const lng = parseFloat(at[3]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    const u = new URL(url);
    for (const k of ['q', 'query', 'll']) {
      const v = u.searchParams.get(k) || '';
      const m = v.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
      if (m) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[3]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
  } catch { /* ignore */ }
  return null;
};

/* =========== Component =========== */

export default function RentalShopEditForm({ id, onClose }: Props) {
  const { t } = useTranslation('common');

  // station + state nội bộ cho tọa độ
  const [station, setStation] = useState<(Partial<RentalStation> & { _lat?: string; _lng?: string }) | null>(null);
  const [saving, setSaving] = useState(false);

  // geocode
  const { coords, geocode } = useGeocodeAddress();
  const geocodeRef = useRef(geocode);
  geocodeRef.current = geocode;

  // fetch on mount
  useEffect(() => {
    (async () => {
      const ref = doc(db, 'rentalStations', id);
      const snap = await getDoc(ref);
      if (!snap.exists()) return;

      const data = snap.data() as RentalStation;
      // ưu tiên lấy lat/lng từ geo; fallback parse từ location
      let lat: string | undefined;
      let lng: string | undefined;

      if (data.geo) {
        lat = String((data.geo as any).latitude ?? data.geo.latitude);
        lng = String((data.geo as any).longitude ?? data.geo.longitude);
      } else {
        const pair = parseLatLngPair(data.location);
        if (pair) {
          lat = String(pair.lat);
          lng = String(pair.lng);
        }
      }

      setStation({
        ...data,
        _lat: lat ?? '',
        _lng: lng ?? '',
      });
    })();
  }, [id]);

  // Tự động geocode khi mapAddress đổi (debounce nhẹ)
  const lastGeocoded = useRef<string | null>(null);
  useEffect(() => {
    if (!station?.mapAddress) return;
    const addr = station.mapAddress.trim();
    if (!addr || addr === lastGeocoded.current) return;

    // 1) Nếu là URL có lat,lng -> set ngay, khỏi gọi geocode
    const fromUrl = extractLatLngFromGMapUrl(addr);
    if (fromUrl) {
      setCoordinates(fromUrl.lat, fromUrl.lng);
      lastGeocoded.current = addr;
      return;
    }

    // 2) Debounce geocode free-text
    const id = setTimeout(() => {
      geocodeRef.current(addr);
      lastGeocoded.current = addr;
    }, 300);
    return () => clearTimeout(id);
  }, [station?.mapAddress]);

  // nhận kết quả geocode
  useEffect(() => {
    if (!coords) return;
    setCoordinates(coords.lat, coords.lng);
  }, [coords]);

  /** đồng bộ 1 chỗ: set _lat/_lng + location "lat,lng" + geo */
  const setCoordinates = useCallback((lat: number, lng: number) => {
    setStation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        _lat: String(lat),
        _lng: String(lng),
        location: `${lat},${lng}`,
        geo: new GeoPoint(lat, lng),
      };
    });
  }, []);

  /** ô tọa độ duy nhất */
  const handleCoordinateChange = (value: string) => {
    const pair = parseLatLngPair(value);
    if (pair) {
      setCoordinates(pair.lat, pair.lng);
    } else {
      // không hợp lệ -> clear _lat/_lng; không đụng location để user vẫn nhìn thấy dữ liệu cũ
      setStation(prev => (prev ? { ...prev, _lat: '', _lng: '' } : prev));
    }
  };

  const handleChange = useCallback((field: keyof RentalStation, value: any) => {
    setStation(prev => (prev ? { ...prev, [field]: value } : prev));
  }, []);

  const handleSave = async () => {
    if (!station) return;
    setSaving(true);
    try {
      // build geo từ _lat/_lng nếu hợp lệ
      let geo: GeoPoint | undefined = undefined;
      const lat = parseFloat(station._lat || '');
      const lng = parseFloat(station._lng || '');
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        geo = new GeoPoint(lat, lng);
      }

      // luôn chuẩn hóa location từ _lat/_lng nếu hợp lệ
      const normalizedLocation =
        Number.isFinite(lat) && Number.isFinite(lng)
          ? `${lat},${lng}`
          : (station.location || '');

      const updateData: Partial<RentalStation> = {
        name: station.name || '',
        displayAddress: station.displayAddress || '',
        mapAddress: station.mapAddress || '',
        location: normalizedLocation,
        contactPhone: station.contactPhone || '',
        vehicleType: station.vehicleType || 'motorbike',
        status: station.status ?? 'active',
        geo: geo ?? undefined,
        updatedAt: Timestamp.now(),
      };

      await updateDoc(doc(db, 'rentalStations', id), updateData);
      onClose();
    } catch (err) {
      console.error(err);
      alert(t('rental_shop_edit_form.update_error'));
    } finally {
      setSaving(false);
    }
  };

  if (!station) return <p className="p-4 text-center">{t('loading')}</p>;

  // Map preview từ geo (ưu tiên) hoặc parse từ location
  const preview: LatLng | null = (() => {
    if (station._lat && station._lng && Number.isFinite(parseFloat(station._lat)) && Number.isFinite(parseFloat(station._lng))) {
      return { lat: parseFloat(station._lat), lng: parseFloat(station._lng) };
    }
    const pair = parseLatLngPair(station.location);
    return pair ?? null;
  })();

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
        className="min-h-[140px]"
      />

      {/* ✅ 1 ô tọa độ duy nhất */}
      <StationField
        label={t('rental_shop_edit_form.coordinates_one_field') /* ví dụ: "Tọa độ (16.07, 108.22 hoặc 16.07° N, 108.22° E)" */}
        value={station._lat && station._lng ? `${station._lat}, ${station._lng}` : (station.location || '')}
        onChange={handleCoordinateChange}
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

      {preview && (
        <div className="h-48 rounded overflow-hidden border mt-2">
          <MapPreview coords={preview} />
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

/* =========== Small Field Component =========== */

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
