// hooks/forms/AddRentalShopForm.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

import { useUser } from '@/src/context/AuthContext';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useContributions } from '@/src/hooks/useContributions';

import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import type { RentalStationFormValues } from '@/src/lib/rentalStations/rentalStationTypes';
import { createRentalStation } from '@/src/lib/rentalStations/rentalStationService';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

type LatLng = { lat: number; lng: number };

/* ================= Helpers ================= */

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

/* ================= Component ================= */

export default function AddRentalShopForm() {
  const { t } = useTranslation('common');
  const { user } = useUser();

  const { coords, geocode } = useGeocodeAddress();
  const geocodeRef = useRef(geocode);
  geocodeRef.current = geocode;

  const { submitContribution } = useContributions();

  // Form + state nội bộ cho preview
  const [form, setForm] = useState<RentalStationFormValues & { _lat?: string; _lng?: string }>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
    contactPhone: '',
    vehicleType: 'motorbike',
    status: 'inactive', // đóng góp mới -> chờ duyệt
    _lat: '',
    _lng: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // GPS toggle
  const [useCurrentPos, setUseCurrentPos] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'ok' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');

  /** Set đồng nhất lat/lng vào _lat/_lng + location("lat,lng") */
  const setCoordinates = useCallback((lat: number, lng: number) => {
    setForm(prev => ({
      ...prev,
      _lat: String(lat),
      _lng: String(lng),
      location: `${lat},${lng}`,
    }));
  }, []);

  /** Một ô tọa độ duy nhất: nhận "16.07, 108.22" hoặc "16.07° N, 108.22° E" */
  const handleCoordinateChange = (value: string) => {
    const pair = parseLatLngPair(value);
    if (pair) {
      setCoordinates(pair.lat, pair.lng);
    } else {
      // Không hợp lệ -> clear _lat/_lng, giữ nguyên location
      setForm(prev => ({ ...prev, _lat: '', _lng: '' }));
    }
  };

  /** Lấy vị trí từ GPS */
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

  // Auto lấy GPS khi bật switch
  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // Nếu KHÔNG dùng GPS: parse từ mapAddress/location hoặc geocode
  useEffect(() => {
    if (useCurrentPos) return;

    const raw = (form.mapAddress || '').trim() || (form.location || '').trim();
    if (!raw) return;

    // 1) Thử parse trực tiếp "lat,lng"
    const byPair = parseLatLngPair(raw);
    if (byPair) {
      setCoordinates(byPair.lat, byPair.lng);
      return;
    }
    // 2) Thử parse URL Google Maps
    const byUrl = extractLatLngFromGMapUrl(raw);
    if (byUrl) {
      setCoordinates(byUrl.lat, byUrl.lng);
      return;
    }
    // 3) Geocode free-text
    const id = setTimeout(() => geocodeRef.current(raw), 300);
    return () => clearTimeout(id);
  }, [useCurrentPos, form.mapAddress, form.location, setCoordinates]);

  // Nhận kết quả geocode (chỉ khi không dùng GPS)
  useEffect(() => {
    if (!coords || useCurrentPos) return;
    setCoordinates(coords.lat, coords.lng);
  }, [coords, useCurrentPos, setCoordinates]);

  const handleChange = (field: keyof RentalStationFormValues, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const canSubmit =
    Boolean(user?.uid) &&
    !!form.name.trim() &&
    !!form.displayAddress.trim() &&
    !!form.location.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const payload: RentalStationFormValues = {
        name: form.name.trim(),
        displayAddress: form.displayAddress.trim(),
        mapAddress: form.mapAddress?.trim() || '',
        location: form.location?.trim() || '',
        contactPhone: form.contactPhone?.trim() || '',
        vehicleType: form.vehicleType || 'motorbike',
        status: form.status ?? 'inactive',
      };

      // Lưu vào hệ thống: companyId 'contributed'
      const created = await createRentalStation(
        { ...payload, companyId: 'contributed' },
        user!.uid
      );

      // Ghi nhận đóng góp
      await submitContribution('rental_shop', created);

      // Reset
      setForm({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        contactPhone: '',
        vehicleType: 'motorbike',
        status: 'inactive',
        _lat: '',
        _lng: '',
      });
      setShowDialog(true);
    } catch (err) {
      console.error('❌ Error adding rental shop:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const previewLatLng: LatLng | null = (() => {
    if (form._lat && form._lng && Number.isFinite(parseFloat(form._lat)) && Number.isFinite(parseFloat(form._lng))) {
      return { lat: parseFloat(form._lat), lng: parseFloat(form._lng) };
    }
    const pair = parseLatLngPair(form.location);
    return pair ?? null;
  })();

  return (
    <div className="space-y-4">
      <Input
        placeholder={t('rental_shop_form.shop_name')}
        value={form.name}
        onChange={(e) => handleChange('name', e.target.value)}
      />

      <Textarea
        placeholder={t('rental_shop_form.display_address')}
        value={form.displayAddress}
        onChange={(e) => handleChange('displayAddress', e.target.value)}
      />

      {/* ✅ Dùng vị trí hiện tại (GPS) */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useCurrentPos}
          onChange={(e) => setUseCurrentPos(e.target.checked)}
        />
        <span>{t('use_current_location_label')}</span>
      </label>

      {/* Địa chỉ Google Maps (tùy chọn) — ẩn khi dùng GPS để tránh ghi đè */}
      {!useCurrentPos && (
        <Textarea
          className="min-h-[120px]"
          placeholder={t('rental_shop_form.map_address')}
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
        placeholder={t('rental_shop_form.phone')}
        value={form.contactPhone}
        onChange={(e) => handleChange('contactPhone', e.target.value)}
      />

      <select
        className="w-full border rounded px-3 py-2"
        value={form.vehicleType || ''}
        onChange={(e) => handleChange('vehicleType', e.target.value as any)}
      >
        <option value="">{t('rental_shop_form.select_vehicle_type')}</option>
        <option value="bike">{t('rental_shop_form.vehicle_bike')}</option>
        <option value="motorbike">{t('rental_shop_form.vehicle_motorbike')}</option>
        <option value="car">{t('rental_shop_form.vehicle_car')}</option>
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

      <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
        {submitting
          ? t('rental_shop_form.submitting')
          : t('rental_shop_form.submit_rental_shop')}
      </Button>

      <NotificationDialog
        open={showDialog}
        type="success"
        title={t('rental_shop_form.thank_you')}
        description={t('rental_shop_form.submission_received')}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
