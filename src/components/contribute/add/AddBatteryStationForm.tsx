'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useBatteryStations } from '@/src/hooks/useBatteryStations';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/src/context/AuthContext';
import { useContributions } from '@/src/hooks/useContributions';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

type LatLng = { lat: number; lng: number };

function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

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

export default function AddBatteryStationForm() {
  const { t } = useTranslation('common');
  const { create, reload } = useBatteryStations();
  const { coords, geocode, loading: geocodeLoading } = useGeocodeAddress();
  const geocodeRef = useRef(geocode);
  geocodeRef.current = geocode;
  const { user } = useUser();
  const { submitContribution } = useContributions();

  const [form, setForm] = useState({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '', // sẽ lưu "lat,lng" khi có toạ độ
    coordinates: undefined as { lat: number; lng: number } | undefined,
    vehicleType: 'motorbike' as 'motorbike' | 'car',
    _lat: '' as string, // internal only
    _lng: '' as string, // internal only
  });

  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // GPS toggle/state
  const [useCurrentPos, setUseCurrentPos] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle'|'getting'|'ok'|'error'>('idle');
  const [gpsError, setGpsError] = useState('');

  const handleChange = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

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
        setForm((prev) => ({
          ...prev,
          _lat: String(latitude),
          _lng: String(longitude),
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

  // Bật GPS → tự get
  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // KHÔNG dùng GPS: parse từ mapAddress/location → nếu không ra thì geocode free-text
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

  // Nhận kết quả geocode (tránh ghi đè khi đang dùng GPS)
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

  // Ô nhập gộp toạ độ (tuỳ chọn)
  const handleLatLngInput = (value: string) => {
    const regex = /(-?\d+(\.\d+)?)\D+(-?\d+(\.\d+)?)/;
    const match = value.match(regex);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[3]);
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
    !!form.location.trim() &&
    // mapAddress chỉ bắt buộc khi KHÔNG dùng GPS
    (useCurrentPos || !!form.mapAddress.trim());

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const data = {
        ...form,
        isActive: false,
        createdBy: user!.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await create(data);
      await submitContribution('battery_station', data);

      setForm({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        coordinates: undefined,
        vehicleType: 'motorbike',
        _lat: '',
        _lng: '',
      });

      setShowDialog(true);
      reload();
    } catch (err) {
      console.error('❌ Error creating battery station:', err);
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

      {/* Toggle GPS */}
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
          placeholder={t('battery_station_form.map_address')}
          value={form.mapAddress}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
        />
      )}

      <Input
        placeholder={t('battery_station_form.location')}
        value={form.location}
        onChange={(e) => handleChange('location', e.target.value)}
      />

      {/* Ô nhập gộp toạ độ */}
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

      <select
        className="w-full border rounded px-3 py-2"
        value={form.vehicleType}
        onChange={(e) => handleChange('vehicleType', e.target.value as 'motorbike' | 'car')}
      >
        <option value="">{t('battery_station_form.select_vehicle_type')}</option>
        <option value="motorbike">{t('battery_station_form.vehicle_motorbike')}</option>
        <option value="car">{t('battery_station_form.vehicle_car')}</option>
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

      <Button onClick={handleSubmit} disabled={submitting || geocodeLoading || !canSubmit}>
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
