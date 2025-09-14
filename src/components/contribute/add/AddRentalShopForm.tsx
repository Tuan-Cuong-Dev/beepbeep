'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Timestamp, collection, addDoc } from 'firebase/firestore';
import dynamic from 'next/dynamic';
import { useUser } from '@/src/context/AuthContext';
import { StationFormValues } from '@/src/lib/stations/stationTypes';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';
import { useContributions } from '@/src/hooks/useContributions';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

type LatLng = { lat: number; lng: number };

/** Parse "lat,lng" (chuẩn) */
function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Parse URL Google Maps để lấy lat,lng (dạng @lat,lng hoặc ?q/query/ll=lat,lng) */
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
    const qs = u.searchParams;
    for (const k of ['q', 'query', 'll']) {
      const v = qs.get(k) || '';
      const m = v.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
      if (m) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[3]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
  } catch { /* ignore */ }
  return null;
}

export default function AddRentalShopForm() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const { coords, geocode } = useGeocodeAddress();
  const geocodeRef = useRef(geocode);
  geocodeRef.current = geocode;
  const { submitContribution } = useContributions();

  // Form state (thêm _lat/_lng nội bộ, KHÔNG ghi Firestore)
  const [form, setForm] = useState<StationFormValues & { _lat?: string; _lng?: string }>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
    geo: undefined,
    contactPhone: '',
    vehicleType: 'motorbike',
    _lat: '',
    _lng: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  // 🔔 Bật/tắt dùng GPS
  const [useCurrentPos, setUseCurrentPos] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle'|'getting'|'ok'|'error'>('idle');
  const [gpsError, setGpsError] = useState('');

  /** Lấy vị trí hiện tại (dùng khi bật checkbox hoặc bấm “Lấy lại vị trí”) */
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
          location: `${latitude},${longitude}`,        // giữ location dạng "lat,lng"
          geo: { lat: latitude, lng: longitude },      // giữ nguyên kiểu geo đang dùng của bạn
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

  // Khi bật “dùng GPS” → gọi getGps()
  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // Khi KHÔNG dùng GPS: parse toạ độ từ mapAddress hoặc location, nếu cần thì geocode
  useEffect(() => {
    if (useCurrentPos) return;

    const raw = (form.mapAddress || '').trim() || (form.location || '').trim();
    if (!raw) return;

    // 1) Thử parse trực tiếp "lat,lng"
    const byPair = parseLatLngString(raw);
    if (byPair) {
      setForm((prev) => ({
        ...prev,
        _lat: String(byPair.lat),
        _lng: String(byPair.lng),
        location: `${byPair.lat},${byPair.lng}`,
        geo: { lat: byPair.lat, lng: byPair.lng },
      }));
      return;
    }

    // 2) Thử parse từ URL Google Maps
    const byUrl = extractLatLngFromGMapUrl(raw);
    if (byUrl) {
      setForm((prev) => ({
        ...prev,
        _lat: String(byUrl.lat),
        _lng: String(byUrl.lng),
        location: `${byUrl.lat},${byUrl.lng}`,
        geo: { lat: byUrl.lat, lng: byUrl.lng },
      }));
      return;
    }

    // 3) Geocode free-text (debounce nhẹ)
    const id = setTimeout(() => geocodeRef.current(raw), 300);
    return () => clearTimeout(id);
  }, [useCurrentPos, form.mapAddress, form.location]);

  // Nhận toạ độ từ hook geocode (chỉ khi KHÔNG dùng GPS để tránh ghi đè)
  useEffect(() => {
    if (!coords || useCurrentPos) return;
    setForm((prev) => ({
      ...prev,
      _lat: String(coords.lat),
      _lng: String(coords.lng),
      location: `${coords.lat},${coords.lng}`,
      geo: { lat: coords.lat, lng: coords.lng },
    }));
  }, [coords, useCurrentPos]);

  const handleChange = (field: keyof StationFormValues, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Gộp input toạ độ (nhập tay): nhận "16.07, 108.22" hoặc "16.07° N, 108.22° E"
  const handleLatLngInput = (value: string) => {
    const regex = /(-?\d+(\.\d+)?)\D+(-?\d+(\.\d+)?)/;
    const match = value.match(regex);
    if (match) {
      const latStr = match[1];
      const lngStr = match[3];
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setForm((prev) => ({
          ...prev,
          _lat: latStr,
          _lng: lngStr,
          location: `${lat},${lng}`,
          geo: { lat, lng },
        }));
        return;
      }
    }
    // Không hợp lệ → xoá _lat/_lng nhưng KHÔNG đụng location cũ
    setForm((prev) => ({ ...prev, _lat: '', _lng: '' }));
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
      const payload: StationFormValues = {
        name: form.name.trim(),
        displayAddress: form.displayAddress.trim(),
        mapAddress: form.mapAddress?.trim() || '',
        location: form.location?.trim() || '',
        geo: form.geo,                         // bạn đang dùng {lat,lng} → giữ nguyên
        contactPhone: form.contactPhone?.trim() || '',
        vehicleType: form.vehicleType || 'motorbike',
      };

      const data = {
        ...payload,
        companyId: 'contributed',
        status: 'inactive',
        createdBy: user!.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // ➕ B1. Tạo station mới
      await addDoc(collection(db, 'rentalStations'), data);

      // ➕ B2. Ghi nhận đóng góp
      await submitContribution('rental_shop', data);

      // ➕ B3. Reset form + thông báo
      setForm({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        geo: undefined,
        contactPhone: '',
        vehicleType: 'motorbike',
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
    const parsed = parseLatLngString(form.location);
    return parsed ?? null;
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

      {/* ✅ Bật dùng vị trí hiện tại (GPS) */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={useCurrentPos}
          onChange={(e) => setUseCurrentPos(e.target.checked)}
        />
        <span>Dùng vị trí hiện tại (GPS) — không cần dán link Google Maps</span>
      </label>

      {/* Ẩn mapAddress khi đang dùng GPS để tránh ghi đè */}
      {!useCurrentPos && (
        <Textarea
          className="min-h-[120px]"
          placeholder={t('rental_shop_form.map_address')}
          value={form.mapAddress}
          onChange={(e) => handleChange('mapAddress', e.target.value)}
        />
      )}

      {/* Vẫn cho phép chỉnh location thủ công (ví dụ text/ghi chú) */}
      <Input
        placeholder={t('rental_shop_form.location')}
        value={form.location}
        onChange={(e) => handleChange('location', e.target.value)}
      />

      {/* Ô nhập toạ độ gộp (tuỳ chọn) */}
      <Input
        placeholder="Tọa độ (vd: 16.07, 108.22 hoặc 16.07° N, 108.22° E)"
        value={form._lat && form._lng ? `${form._lat}, ${form._lng}` : ''}
        onChange={(e) => handleLatLngInput(e.target.value)}
      />

      {/* Map preview (nếu có toạ độ hợp lệ) */}
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
