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
  location: string; // "lat,lng" text
  _lat?: string;    // internal only
  _lng?: string;    // internal only
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

/** Parse "lat,lng" */
function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Lấy lat,lng từ URL Google Maps: @lat,lng hoặc ?q/query/ll=lat,lng */
function extractLatLngFromGMapUrl(url?: string): LatLng | null {
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
}

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

  // GPS state
  const [useCurrentPos, setUseCurrentPos] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'ok' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');

  /** Lấy vị trí hiện tại */
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
        const { latitude, longitude } = pos.coords;
        const latStr = String(latitude);
        const lngStr = String(longitude);
        setForm((prev) => ({
          ...prev,
          _lat: latStr,
          _lng: lngStr,
          location: `${latitude},${longitude}`,
          coordinates: { lat: latitude, lng: longitude },
        }));
        setGpsStatus('ok');
      },
      (err) => {
        setGpsStatus('error');
        setGpsError(err.message || 'Không lấy được vị trí hiện tại.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Bật GPS → auto get
  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // KHÔNG dùng GPS → parse từ mapAddress/location hoặc geocode free-text
  useEffect(() => {
    if (useCurrentPos) return;

    const raw = (form.mapAddress || '').trim() || (form.location || '').trim();
    if (!raw) return;

    const byPair = parseLatLngString(raw);
    if (byPair) {
      setForm((prev) => ({
        ...prev,
        _lat: String(byPair.lat),
        _lng: String(byPair.lng),
        location: `${byPair.lat},${byPair.lng}`,
        coordinates: { lat: byPair.lat, lng: byPair.lng },
      }));
      return;
    }

    const byUrl = extractLatLngFromGMapUrl(raw);
    if (byUrl) {
      setForm((prev) => ({
        ...prev,
        _lat: String(byUrl.lat),
        _lng: String(byUrl.lng),
        location: `${byUrl.lat},${byUrl.lng}`,
        coordinates: { lat: byUrl.lat, lng: byUrl.lng },
      }));
      return;
    }

    const id = setTimeout(() => geocodeRef.current(raw), 300);
    return () => clearTimeout(id);
  }, [useCurrentPos, form.mapAddress, form.location]);

  // Nhận coords từ geocode (chỉ khi không dùng GPS)
  useEffect(() => {
    if (!coords || useCurrentPos) return;
    setForm((prev) => ({
      ...prev,
      _lat: String(coords.lat),
      _lng: String(coords.lng),
      location: `${coords.lat},${coords.lng}`,
      coordinates: { lat: coords.lat, lng: coords.lng },
    }));
  }, [coords, useCurrentPos]);

  const handleChange = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Ô nhập toạ độ gộp
  const handleLatLngInput = (value: string) => {
    const regex = /(-?\d+(\.\d+)?)\D+(-?\d+(\.\d+)?)/;
    const m = value.match(regex);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[3]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setForm((prev) => ({
          ...prev,
          _lat: String(lat),
          _lng: String(lng),
          location: `${lat},${lng}`,
          coordinates: { lat, lng },
        }));
        return;
      }
    }
    setForm((prev) => ({ ...prev, _lat: '', _lng: '' }));
  };

  const canSubmit =
    !!user?.uid &&
    !!form.name.trim() &&
    !!form.displayAddress.trim() &&
    !!form.phone.trim() &&
    // mapAddress chỉ bắt buộc khi KHÔNG dùng GPS
    (useCurrentPos || !!form.mapAddress.trim()) &&
    // cần có location (từ GPS hoặc parse)
    !!form.location.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const data: BatteryChargingStation & { createdBy: string } = {
        // các field gốc
        name: form.name.trim(),
        displayAddress: form.displayAddress.trim(),
        mapAddress: form.mapAddress?.trim() || '',
        phone: form.phone.trim(),
        vehicleType: form.vehicleType,
        description: form.description?.trim() || '',
        isActive: false,
        coordinates: form.coordinates, // {lat,lng} | undefined
        // các trường meta
        id: '', // Firestore sẽ tự tạo, bạn có thể cập nhật lại sau nếu muốn
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
    if (form._lat && form._lng && Number.isFinite(parseFloat(form._lat)) && Number.isFinite(parseFloat(form._lng))) {
      return { lat: parseFloat(form._lat), lng: parseFloat(form._lng) };
    }
    const parsed = parseLatLngString(form.location);
    return parsed ?? null;
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
        <span>Dùng vị trí hiện tại (GPS) — không cần dán link Google Maps</span>
      </label>

      {/* mapAddress ẩn khi dùng GPS để tránh ghi đè */}
      {!useCurrentPos && (
        <Textarea
          className="min-h-[180px]"
          placeholder={t('add_battery_charging_station_form.map_address')}
          value={form.mapAddress}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
        />
      )}

      {/* location hiển thị/cho sửa nhanh (chuỗi "lat,lng" hoặc mô tả) */}
      <Input
        placeholder={t('add_battery_charging_station_form.location')}
        value={form.location}
        onChange={(e) => handleChange('location', e.target.value)}
      />

      {/* Ô nhập toạ độ gộp (tuỳ chọn) */}
      <Input
        placeholder="Tọa độ (vd: 16.07, 108.22 hoặc 16.07° N, 108.22° E)"
        value={form._lat && form._lng ? `${form._lat}, ${form._lng}` : ''}
        onChange={(e) => handleLatLngInput(e.target.value)}
      />

      {/* Map preview nếu có toạ độ */}
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
        className="min-h-[180px]"
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
