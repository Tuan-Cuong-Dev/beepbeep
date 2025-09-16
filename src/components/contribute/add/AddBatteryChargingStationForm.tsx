// Trạm sạc pin

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
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

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

type LatLng = { lat: number; lng: number };

type FormState = Omit<
  BatteryChargingStation,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy'
> & {
  location: string; // "lat,lng"
  _lat?: string;    // internal only for UI
  _lng?: string;    // internal only for UI
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
  _lat: '',
  _lng: '',
};

/* ========== Helpers ========== */

// Parse "16.07, 108.22" hoặc "16.07° N, 108.22° E"
const parseLatLngPair = (s?: string): LatLng | null => {
  if (!s) return null;
  const m = s.match(/(-?\d+(\.\d+)?)\D+(-?\d+(\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
};

// Lấy lat,lng từ URL Google Maps: @lat,lng hoặc ?q/query/ll=lat,lng
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
  } catch {}
  return null;
};

/* ========== Component ========== */

export default function AddBatteryChargingStationForm() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const { coords, geocode } = useGeocodeAddress();
  const geocodeRef = useRef(geocode);
  geocodeRef.current = geocode;
  const { submitContribution } = useContributions();

  const [form, setForm] = useState<FormState>(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // GPS toggle/state
  const [useCurrentPos, setUseCurrentPos] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'ok' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');

  /** Đồng bộ 1 chỗ: _lat/_lng + location "lat,lng" + coordinates {lat,lng} */
  const setCoordinates = useCallback((lat: number, lng: number) => {
    setForm(prev => ({
      ...prev,
      _lat: String(lat),
      _lng: String(lng),
      location: `${lat},${lng}`,
      coordinates: { lat, lng },
    }));
  }, []);

  /** Một ô tọa độ duy nhất */
  const handleCoordinateChange = (value: string) => {
    const pair = parseLatLngPair(value);
    if (pair) {
      setCoordinates(pair.lat, pair.lng);
    } else {
      // không hợp lệ -> clear _lat/_lng (không đụng location để user vẫn thấy giá trị cũ)
      setForm(prev => ({ ...prev, _lat: '', _lng: '' }));
    }
  };

  /** Lấy vị trí hiện tại (GPS) */
  const getGps = useCallback(() => {
    setGpsStatus('getting');
    setGpsError('');
    if (!('geolocation' in navigator)) {
      setGpsStatus('error');
      setGpsError('Trình duyệt không hỗ trợ Geolocation.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates(pos.coords.latitude, pos.coords.longitude);
        setGpsStatus('ok');
      },
      (err) => {
        setGpsStatus('error');
        setGpsError(err.message || 'Không lấy được vị trí hiện tại.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [setCoordinates]);

  // Bật GPS → auto get
  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // KHÔNG dùng GPS → parse từ mapAddress hoặc geocode free-text
  useEffect(() => {
    if (useCurrentPos) return;

    const raw = (form.mapAddress || '').trim();
    if (!raw) return;

    const byPair = parseLatLngPair(raw);
    if (byPair) {
      setCoordinates(byPair.lat, byPair.lng);
      return;
    }

    const byUrl = extractLatLngFromGMapUrl(raw);
    if (byUrl) {
      setCoordinates(byUrl.lat, byUrl.lng);
      return;
    }

    const id = setTimeout(() => geocodeRef.current(raw), 300);
    return () => clearTimeout(id);
  }, [useCurrentPos, form.mapAddress, setCoordinates]);

  // Nhận coords từ geocode (chỉ khi không dùng GPS)
  useEffect(() => {
    if (!coords || useCurrentPos) return;
    setCoordinates(coords.lat, coords.lng);
  }, [coords, useCurrentPos, setCoordinates]);

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canSubmit =
    !!user?.uid &&
    !!form.name.trim() &&
    !!form.displayAddress.trim() &&
    !!form.phone.trim() &&
    // mapAddress chỉ bắt buộc khi KHÔNG dùng GPS
    (useCurrentPos || !!form.mapAddress.trim()) &&
    // cần có location (từ GPS/parse/geocode)
    !!form.location.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const data: BatteryChargingStation & { createdBy: string } = {
        name: form.name.trim(),
        displayAddress: form.displayAddress.trim(),
        mapAddress: form.mapAddress?.trim() || '',
        phone: form.phone.trim(),
        vehicleType: form.vehicleType,
        description: form.description?.trim() || '',
        isActive: false,
        coordinates: form.coordinates, // {lat,lng} | undefined
        // meta
        id: '' as any, // Firestore sẽ gán sau
        createdBy: user!.uid,
        createdAt: Timestamp.now() as any,
        updatedAt: Timestamp.now() as any,
      } as any;

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

  const previewLatLng: LatLng | null = (() => {
    if (
      form._lat && form._lng &&
      Number.isFinite(parseFloat(form._lat)) &&
      Number.isFinite(parseFloat(form._lng))
    ) {
      return { lat: parseFloat(form._lat), lng: parseFloat(form._lng) };
    }
    const pair = parseLatLngPair(form.location);
    return pair ?? null;
  })();

  return (
    <div className="space-y-4">
      {/* THÔNG TIN CƠ BẢN */}
      <h3 className="font-semibold text-lg">
        {t('add_battery_charging_station_form.section.basic_info')}
      </h3>

      <Input
        placeholder={t('add_battery_charging_station_form.station_name')}
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />
      <Textarea
        placeholder={t('add_battery_charging_station_form.display_address')}
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />

      {/* GPS toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useCurrentPos}
          onChange={(e) => setUseCurrentPos(e.target.checked)}
        />
        <span>{t('use_current_location_label')}</span>
      </label>

      {/* mapAddress ẩn khi dùng GPS để tránh ghi đè */}
      {!useCurrentPos && (
        <Textarea
          className="min-h-[160px]"
          placeholder={t('add_battery_charging_station_form.map_address')}
          value={form.mapAddress}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
        />
      )}

      {/* ✅ Chỉ còn 1 ô TỌA ĐỘ duy nhất */}
      <Input
        placeholder="Tọa độ (vd: 16.07, 108.22 hoặc 16.07° N, 108.22° E)"
        value={form._lat && form._lng ? `${form._lat}, ${form._lng}` : form.location}
        onChange={(e) => handleCoordinateChange(e.target.value)}
      />

      {/* Map preview */}
      {previewLatLng && (
        <div className="h-48 rounded overflow-hidden border">
          <MapPreview coords={previewLatLng} />
        </div>
      )}

      <Input
        placeholder={t('add_battery_charging_station_form.phone')}
        value={form.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
      />

      {/* MÔ TẢ & PHÂN LOẠI */}
      <h3 className="font-semibold text-lg mt-6">
        {t('add_battery_charging_station_form.section.details')}
      </h3>
      <Textarea
        className="min-h-[160px]"
        placeholder={t('add_battery_charging_station_form.description')}
        value={form.description}
        onChange={(e) => handleChange('description', e.target.value)}
      />
      <select
        className="w-full border rounded px-3 py-2"
        value={form.vehicleType}
        onChange={(e) =>
          handleChange('vehicleType', e.target.value as 'motorbike' | 'car')
        }
      >
        <option value="motorbike">
          {t('add_battery_charging_station_form.vehicle_type.motorbike')}
        </option>
        <option value="car">
          {t('add_battery_charging_station_form.vehicle_type.car')}
        </option>
      </select>

      {/* Trạng thái GPS + nút refresh */}
      {useCurrentPos && (
        <div className="text-xs text-gray-600">
          {gpsStatus === 'getting' && 'Đang lấy vị trí…'}
          {gpsStatus === 'ok' && 'Đã lấy vị trí từ GPS.'}
          {gpsStatus === 'error' && <span className="text-red-600">Lỗi: {gpsError}</span>}
          <div className="mt-2">
            <Button type="button" variant="outline" onClick={getGps}>
              Lấy lại vị trí
            </Button>
          </div>
        </div>
      )}

      {/* NÚT GỬI */}
      <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
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
