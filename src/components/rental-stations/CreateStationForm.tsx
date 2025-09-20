'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { db, auth } from '@/src/firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  GeoPoint,
} from 'firebase/firestore';
import { getIdTokenResult } from 'firebase/auth';

import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useTranslation } from 'react-i18next';

import type {
  RentalStationFormValues,
  StationStatus,
  VehicleType,
} from '@/src/lib/rentalStations/rentalStationTypes';

interface Props {
  companyId: string;
  onCreated?: () => void;
}

// ===== Helpers =====
function toCoordString(lat: number, lng: number) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat).toFixed(4);
  const absLng = Math.abs(lng).toFixed(4);
  return `${absLat}° ${ns}, ${absLng}° ${ew}`;
}

function parseCommaLatLng(input: string): { lat: number; lng: number } | null {
  const [latStr, lngStr] = input.split(',').map((s) => s.trim());
  if (!latStr || !lngStr) return null;
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

type LatLng = { lat: number; lng: number };

export default function CreateStationForm({ companyId, onCreated }: Props) {
  const { t } = useTranslation('common');

  const [companyName, setCompanyName] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<
    RentalStationFormValues & {
      _lat?: string; // nội bộ cho ô nhập gộp
      _lng?: string; // nội bộ cho ô nhập gộp
    }
  >({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '', // sẽ tự điền "lat,lng" khi geocode/GPS xong
    contactPhone: '',
    vehicleType: 'motorbike', // ✅ mặc định
    // status để backend/service có thể set 'active' nếu muốn
    _lat: '',
    _lng: '',
  });

  // GPS toggle/state
  const [useCurrentPos, setUseCurrentPos] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'ok' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');
  const [gpsCoords, setGpsCoords] = useState<LatLng | null>(null);

  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') =>
    setDialog({ open: true, type, title, description });

  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();

  // Lấy tên công ty
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const docRef = doc(db, 'rentalCompanies', companyId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCompanyName((snap.data() as any).name || '');
        }
      } catch (err) {
        console.error('❌ Failed to load company name:', err);
      }
    };
    if (companyId) fetchCompanyName();
  }, [companyId]);

  // Lấy role từ custom claims
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const token = await getIdTokenResult(user, true);
      const role = typeof token.claims.role === 'string' ? (token.claims.role as string) : 'unknown';
      setUserRole(role);
    };
    fetchRole();
  }, []);

  // ===== GPS =====
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
        const lat = latitude;
        const lng = longitude;
        setGpsCoords({ lat, lng });
        // điền trực tiếp vào input location (chuỗi "lat,lng")
        setFormValues((prev) => ({
          ...prev,
          _lat: String(lat),
          _lng: String(lng),
          location: `${lat},${lng}`,
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

  // Khi bật dùng GPS → auto lấy vị trí
  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // Khi có coords từ geocode -> đổ vào ô location dạng "lat,lng" (CHỈ khi KHÔNG dùng GPS)
  useEffect(() => {
    if (!coords || useCurrentPos) return;
    setFormValues((prev) => ({
      ...prev,
      _lat: String(coords.lat),
      _lng: String(coords.lng),
      location: `${coords.lat},${coords.lng}`,
    }));
  }, [coords, useCurrentPos]);

  // Geocode khi blur mapAddress (chỉ khi không dùng GPS)
  const handleGeocode = () => {
    if (!useCurrentPos && formValues.mapAddress.trim()) geocode(formValues.mapAddress);
  };

  // Ô toạ độ gộp (tuỳ chọn)
  const handleLatLngInput = (value: string) => {
    setFormValues((prev) => {
      const parsed = parseCommaLatLng(value);
      if (parsed) {
        return {
          ...prev,
          _lat: String(parsed.lat),
          _lng: String(parsed.lng),
          location: `${parsed.lat},${parsed.lng}`,
        };
      }
      return { ...prev, _lat: '', _lng: '' };
    });
  };

  // Toạ độ dùng cho preview (ưu tiên GPS → geocode → parse location)
  const previewCoords: LatLng | null = useMemo(() => {
    if (gpsCoords) return gpsCoords;
    if (coords && !useCurrentPos) return coords;
    return parseCommaLatLng(formValues.location);
  }, [gpsCoords, coords, useCurrentPos, formValues.location]);

  // ===== Submit =====
  const handleCreate = async () => {
    const { name, displayAddress, mapAddress, location, contactPhone, vehicleType, status } = formValues;

    // mapAddress chỉ bắt buộc khi KHÔNG dùng GPS
    if (!name.trim() || !displayAddress.trim() || (!useCurrentPos && !mapAddress.trim()) || !location.trim()) {
      return showDialog('error', t('station_form.error_title'), t('station_form.error_missing_fields'));
    }

    const parsed = gpsCoords ?? coords ?? parseCommaLatLng(location);
    if (!parsed) {
      return showDialog('error', t('station_form.invalid_coords_title'), t('station_form.invalid_coords_desc'));
    }

    const { lat, lng } = parsed;
    const locationString = toCoordString(lat, lng); // "16.0226° N, 108.1207° E"
    const geo = new GeoPoint(lat, lng);

    setLoading(true);
    try {
      await addDoc(collection(db, 'rentalStations'), {
        companyId,
        name: name.trim(),
        displayAddress: displayAddress.trim(),
        mapAddress: useCurrentPos ? null : (mapAddress?.trim() || null), // giữ logic hiện tại của bạn
        contactPhone: contactPhone?.trim() || null,
        location: locationString,
        geo,
        vehicleType: (vehicleType as VehicleType) || null, // ✅ dùng giá trị từ select
        status: (status as StationStatus) || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      showDialog('success', t('station_form.success_title'), t('station_form.success_desc'));
      setFormValues({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        contactPhone: '',
        vehicleType: 'motorbike', // ✅ reset về mặc định
        _lat: '',
        _lng: '',
      });
      setGpsCoords(null);
      setUseCurrentPos(false);
      setGpsStatus('idle');
      onCreated?.();
    } catch (err) {
      console.error('❌ Error creating station:', err);
      showDialog('error', t('station_form.create_failed_title'), t('station_form.create_failed_desc'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {(companyName || userRole) && (
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 space-y-1">
            {companyName && (
              <p>
                🏢 <span className="font-semibold">{t('station_form.company')}:</span> {companyName}
              </p>
            )}
            {userRole && (
              <p>
                🛂 <span className="font-semibold">{t('station_form.role')}:</span> {t(`roles.${userRole || 'unknown'}`)}
              </p>
            )}
          </div>
        )}

        <Input
          placeholder={t('station_form.station_name')}
          value={formValues.name}
          onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
        />

        <Textarea
          placeholder={t('station_form.display_address')}
          value={formValues.displayAddress}
          onChange={(e) => setFormValues((prev) => ({ ...prev, displayAddress: e.target.value }))}
        />

        {/* ✅ Toggle GPS */}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={useCurrentPos} onChange={(e) => setUseCurrentPos(e.target.checked)} />
          <span>{t('use_current_location_label', 'Dùng vị trí hiện tại (GPS) — không cần dán link Google Maps')}</span>
        </label>

        {/* Ẩn mapAddress khi dùng GPS để tránh ghi đè */}
        {!useCurrentPos && (
          <Textarea
            placeholder={t('station_form.map_address')}
            value={formValues.mapAddress}
            onChange={(e) => setFormValues((prev) => ({ ...prev, mapAddress: e.target.value }))}
            onBlur={handleGeocode}
            className="min-h-[120px]"
          />
        )}

        <Input
          placeholder={t('station_form.contact_phone')}
          value={formValues.contactPhone}
          onChange={(e) => setFormValues((prev) => ({ ...prev, contactPhone: e.target.value }))}
        />

        {/* ✅ Vehicle type select */}
        <select
          className="w-full border rounded px-3 py-2"
          value={formValues.vehicleType || ''}
          onChange={(e) => setFormValues((prev) => ({ ...prev, vehicleType: e.target.value as VehicleType }))}
        >
          <option value="">{t('rental_station_form.select_vehicle_type', 'Chọn loại phương tiện')}</option>
          <option value="bike">{t('rental_shop_form.vehicle_bike', 'Xe đạp')}</option>
          <option value="motorbike">{t('rental_shop_form.vehicle_motorbike', 'Xe máy')}</option>
          <option value="car">{t('rental_shop_form.vehicle_car', 'Ô tô')}</option>
        </select>

        {/* Ô toạ độ gộp (cho nhập tay nếu cần) */}
        <Input
          placeholder={t('station_form.coordinates')}
          value={formValues._lat && formValues._lng ? `${formValues._lat}, ${formValues._lng}` : formValues.location}
          readOnly={useCurrentPos || !!coords}
          onChange={(e) => handleLatLngInput(e.target.value)}
        />

        {/* Trạng thái GPS */}
        {useCurrentPos && (
          <p className="text-xs text-gray-600">
            {gpsStatus === 'getting' && t('gps.getting', 'Đang lấy vị trí…')}
            {gpsStatus === 'ok' && t('gps.ok', 'Đã lấy vị trí từ GPS.')}
            {gpsStatus === 'error' && (
              <span className="text-red-600">
                {t('gps.error_prefix', 'Lỗi:')} {gpsError}
              </span>
            )}
            <Button type="button" variant="outline" className="ml-2" onClick={getGps}>
              {t('gps.refresh', 'Lấy lại vị trí')}
            </Button>
          </p>
        )}

        {/* Geocode status */}
        {!useCurrentPos && geoLoading && <p className="text-sm text-gray-500">{t('station_form.detecting_coords')}</p>}
        {!useCurrentPos && geoError && <p className="text-sm text-red-500">{geoError}</p>}

        {/* Map preview */}
        {previewCoords && (
          <>
            <p className="text-sm text-gray-600">
              📌{' '}
              {t('station_form.detected_coords', {
                lat: previewCoords.lat.toString(),
                lng: previewCoords.lng.toString(),
              })}
            </p>
            <iframe
              title="Map Preview"
              width="100%"
              height="200"
              className="rounded-xl"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${previewCoords.lat},${previewCoords.lng}&hl=en&z=16&output=embed`}
            />
          </>
        )}

        <Button onClick={handleCreate} disabled={loading}>
          {loading ? t('station_form.creating') : t('station_form.create_button')}
        </Button>
      </div>

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={() => setDialog((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
