// Trạm đổi pin

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
  } catch {}
  return null;
};

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
    // không render input riêng cho location, nhưng vẫn lưu chuỗi "lat,lng"
    location: '',
    coordinates: undefined as { lat: number; lng: number } | undefined,
    vehicleType: 'motorbike' as 'motorbike' | 'car',
    _lat: '' as string, // nội bộ cho ô tọa độ duy nhất
    _lng: '' as string,
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

  /** Đồng bộ 1 chỗ: _lat/_lng + location "lat,lng" + coordinates */
  const setCoordinates = useCallback((lat: number, lng: number) => {
    setForm(prev => ({
      ...prev,
      _lat: String(lat),
      _lng: String(lng),
      location: `${lat},${lng}`,
      coordinates: { lat, lng },
    }));
  }, []);

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

  // Bật GPS → tự get
  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // KHÔNG dùng GPS: parse từ mapAddress → nếu không ra thì geocode free-text
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

  // Nhận kết quả geocode (chỉ khi không dùng GPS)
  useEffect(() => {
    if (!coords || useCurrentPos) return;
    setCoordinates(coords.lat, coords.lng);
  }, [coords, useCurrentPos, setCoordinates]);

  // Ô tọa độ duy nhất (nhập tay)
  const handleCoordinateInput = (value: string) => {
    const pair = parseLatLngPair(value);
    if (pair) {
      setCoordinates(pair.lat, pair.lng);
    } else {
      setForm(prev => ({ ...prev, _lat: '', _lng: '' }));
    }
  };

  const canSubmit =
    !!user?.uid &&
    !!form.name.trim() &&
    !!form.displayAddress.trim() &&
    // cần có tọa độ (từ GPS/parse/geocode)
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
    const parsed = parseLatLngPair(form.location);
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
        <span>{t('use_current_location_label')}</span>
      </label>

      {/* mapAddress ẩn khi dùng GPS để tránh ghi đè */}
      {!useCurrentPos && (
        <Textarea
          className="min-h-[160px]"
          placeholder={t('battery_station_form.map_address')}
          value={form.mapAddress}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
        />
      )}

      {/* ✅ Chỉ còn 1 ô TỌA ĐỘ duy nhất */}
      <Input
        placeholder="Tọa độ (vd: 16.07, 108.22 hoặc 16.07° N, 108.22° E)"
        value={form._lat && form._lng ? `${form._lat}, ${form._lng}` : form.location}
        onChange={(e) => handleCoordinateInput(e.target.value)}
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
