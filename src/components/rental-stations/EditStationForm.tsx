'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { doc, updateDoc, serverTimestamp, GeoPoint } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useTranslation } from 'react-i18next';

// ✅ DÙNG TYPES MỚI
import type {
  RentalStation,
  RentalStationFormValues,
  StationStatus,
} from '@/src/lib/rentalStations/rentalStationTypes';
import NotificationDialog from '../ui/NotificationDialog';

interface Props {
  companyId: string;
  editingStation: RentalStation;
  onCancel: () => void;
  onSaved: () => void;
}

/* ===== Helpers ===== */
type LatLng = { lat: number; lng: number };

function toCoordString(lat: number, lng: number) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat).toFixed(4);
  const absLng = Math.abs(lng).toFixed(4);
  return `${absLat}° ${ns}, ${absLng}° ${ew}`;
}

/** "16.0226,108.1207" → {lat,lng} */
function parseCommaLatLng(input?: string): LatLng | null {
  if (!input) return null;
  const [latStr, lngStr] = input.split(',').map((s) => s.trim());
  if (!latStr || !lngStr) return null;
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/** "16.0226° N, 108.1207° E" → {lat,lng} */
function parseDegreeString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/(-?\d+(\.\d+)?)°\s*([NS])\s*,\s*(-?\d+(\.\d+)?)°\s*([EW])/i);
  if (!m) return null;
  let lat = parseFloat(m[1]);
  let lng = parseFloat(m[4]);
  const ns = m[3].toUpperCase();
  const ew = m[6].toUpperCase();
  if (ns === 'S') lat = -Math.abs(lat);
  if (ns === 'N') lat = Math.abs(lat);
  if (ew === 'W') lng = -Math.abs(lng);
  if (ew === 'E') lng = Math.abs(lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

/** Nhận mọi kiểu geo phổ biến → {lat,lng} hoặc null */
function coerceGeo(geo: any): LatLng | null {
  if (!geo) return null;
  if (typeof geo.latitude === 'number' && typeof geo.longitude === 'number') {
    return { lat: geo.latitude, lng: geo.longitude }; // Firestore GeoPoint
  }
  if (typeof geo.lat === 'number' && typeof geo.lng === 'number') {
    return { lat: geo.lat, lng: geo.lng }; // plain object
  }
  return null;
}

/** Bỏ toàn bộ field undefined (deep) để an toàn Firestore */
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj as T;
  if (Array.isArray(obj)) {
    return obj.map(stripUndefined).filter((v) => v !== undefined) as unknown as T;
  }
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj as Record<string, any>)) {
    if (v === undefined) continue;
    out[k] = stripUndefined(v);
  }
  return out as T;
}

export default function EditStationForm({
  companyId,
  editingStation,
  onCancel,
  onSaved,
}: Props) {
  const { t } = useTranslation('common');

  // Form theo RentalStationFormValues (client-side)
  const [form, setForm] = useState<RentalStationFormValues & { _lat?: string; _lng?: string }>({
    name: editingStation.name || '',
    displayAddress: editingStation.displayAddress || '',
    mapAddress: editingStation.mapAddress || '', // ❗ type yêu cầu string
    location: editingStation.location || '',     // text hiển thị
    contactPhone: editingStation.contactPhone ?? '',
    vehicleType: editingStation.vehicleType,
    status: (editingStation.status as StationStatus) ?? 'active',
    _lat: '',
    _lng: '',
  });

  const { coords, geocode, loading: geoLoading, error: geoError } = useGeocodeAddress();

  // Toggle GPS
  const [useCurrentPos, setUseCurrentPos] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'getting' | 'ok' | 'error'>('idle');
  const [gpsError, setGpsError] = useState('');
  const [gpsCoords, setGpsCoords] = useState<LatLng | null>(null);

  // Init lat,lng vào ô gộp (nếu có)
  useEffect(() => {
    const init =
      coerceGeo(editingStation.geo) ??
      parseDegreeString(editingStation.location) ??
      parseCommaLatLng(editingStation.location);
    if (init) setForm((p) => ({ ...p, _lat: String(init.lat), _lng: String(init.lng) }));
  }, [editingStation]);

  /** Lấy vị trí hiện tại qua GPS */
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
        setGpsCoords({ lat: latitude, lng: longitude });
        setForm((prev) => ({
          ...prev,
          _lat: String(latitude),
          _lng: String(longitude),
          location: toCoordString(latitude, longitude),
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

  useEffect(() => {
    if (useCurrentPos) getGps();
  }, [useCurrentPos, getGps]);

  // Geocode thành công (khi KHÔNG dùng GPS) → cập nhật
  useEffect(() => {
    if (!coords || useCurrentPos) return;
    setForm((prev) => ({
      ...prev,
      _lat: String(coords.lat),
      _lng: String(coords.lng),
      location: toCoordString(coords.lat, coords.lng),
    }));
  }, [coords, useCurrentPos]);

  const handleChange = <K extends keyof RentalStationFormValues>(key: K, value: RentalStationFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Chỉ geocode khi KHÔNG dùng GPS
  const handleMapAddressBlur = () => {
    if (!useCurrentPos && form.mapAddress.trim()) geocode(form.mapAddress);
  };

  // Ô toạ độ gộp
  const handleLatLngInput = (value: string) => {
    const parsed = parseCommaLatLng(value);
    if (parsed) {
      setForm((prev) => ({
        ...prev,
        _lat: String(parsed.lat),
        _lng: String(parsed.lng),
        location: toCoordString(parsed.lat, parsed.lng),
      }));
    } else {
      setForm((prev) => ({ ...prev, _lat: '', _lng: '' }));
    }
  };

  // Toạ độ preview: GPS → geocode → parse location → geo cũ
  const previewCoords: LatLng | null = useMemo(() => {
    if (gpsCoords) return gpsCoords;
    if (coords && !useCurrentPos) return coords;
    const fromDeg = parseDegreeString(form.location);
    if (fromDeg) return fromDeg;
    if (form._lat && form._lng) {
      const lat = parseFloat(form._lat);
      const lng = parseFloat(form._lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    return coerceGeo(editingStation.geo);
  }, [gpsCoords, coords, useCurrentPos, form.location, form._lat, form._lng, editingStation.geo]);

  // ====== Lưu thay đổi ======
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });
  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') =>
    setDialog({ open: true, type, title, description });

  const handleUpdate = async () => {
    // Chọn toạ độ cuối cùng để lưu
    const final =
      gpsCoords ??
      coords ??
      parseDegreeString(form.location) ??
      (form._lat && form._lng ? parseCommaLatLng(`${form._lat},${form._lng}`) : null) ??
      coerceGeo(editingStation.geo);

    // Build giá trị location & geo
    const lat = final?.lat;
    const lng = final?.lng;

    const locationString =
      typeof lat === 'number' && typeof lng === 'number'
        ? toCoordString(lat, lng)
        : form.location || editingStation.location || '';

    // Theo type mới: geo?: GeoPoint. Chỉ set khi có toạ độ, nếu không thì BỎ FIELD.
    const geoValue: GeoPoint | undefined =
      typeof lat === 'number' && typeof lng === 'number'
        ? new GeoPoint(lat, lng)
        : undefined;

    // Validate cơ bản
    if (!form.name.trim() || !form.displayAddress.trim()) {
      return showDialog(
        'error',
        t('rental_station_form.error_title', 'Lỗi'),
        t('rental_station_form.error_missing_fields', 'Vui lòng nhập đủ tên và địa chỉ hiển thị.')
      );
    }

    // Theo type mới: mapAddress là string → nếu dùng GPS thì ghi '' để khớp type
    const mapAddressToSave = useCurrentPos ? '' : (form.mapAddress?.trim() || '');

    // contactPhone theo type là optional string → có thể để '' thay vì null
    const contactPhoneToSave = form.contactPhone?.trim() || '';

    // vehicleType/status đều optional → ghi nếu có
    const updatePayload = stripUndefined({
      companyId,
      name: form.name.trim(),
      displayAddress: form.displayAddress.trim(),
      mapAddress: mapAddressToSave,           // ✅ luôn là string
      contactPhone: contactPhoneToSave,       // ✅ string (cho thống nhất schema)
      location: locationString,               // ✅ text SEO/hiển thị
      ...(geoValue ? { geo: geoValue } : {}), // ✅ chỉ set nếu có
      ...(form.vehicleType ? { vehicleType: form.vehicleType } : {}),
      ...(form.status ? { status: form.status as StationStatus } : {}),
      updatedAt: serverTimestamp(),
    });

    setSaving(true);
    try {
      await updateDoc(doc(db, 'rentalStations', editingStation.id), updatePayload);
      showDialog(
        'success',
        t('rental_station_form.saved_title', 'Đã lưu thay đổi'),
        t('rental_station_form.saved_desc', 'Trạm đã được cập nhật.')
      );
      onSaved();
    } catch (err) {
      console.error('❌ Error updating station:', err);
      showDialog(
        'error',
        t('rental_station_form.save_failed_title', 'Cập nhật thất bại'),
        t('rental_station_form.save_failed_desc', 'Vui lòng thử lại.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">✏️ {t('rental_station_form.edit_title')}</h2>

        <Input
          placeholder={t('rental_station_form.station_name')}
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
        />
        <Textarea
          placeholder={t('rental_station_form.display_address')}
          value={form.displayAddress}
          onChange={(e) => handleChange('displayAddress', e.target.value)}
        />

        {/* ✅ Toggle GPS */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useCurrentPos}
            onChange={(e) => setUseCurrentPos(e.target.checked)}
          />
          <span>{t('use_current_location_label', 'Dùng vị trí hiện tại (GPS) — không cần dán link Google Maps')}</span>
        </label>

        {/* Ẩn mapAddress khi dùng GPS để tránh ghi đè */}
        {!useCurrentPos && (
          <Textarea
            placeholder={t('rental_station_form.map_address')}
            value={form.mapAddress}
            onChange={(e) => handleChange('mapAddress', e.target.value)}
            onBlur={handleMapAddressBlur}
            className="min-h-[120px]"
          />
        )}

        <Input
          placeholder={t('station_form.contact_phone')}
          value={form.contactPhone}
          onChange={(e) => handleChange('contactPhone', e.target.value)}
        />

        {/* Ô toạ độ gộp để nhập tay (lat,lng) */}
        <Input
          placeholder={t('rental_station_form.coordinates')}
          value={
            form._lat && form._lng
              ? `${form._lat}, ${form._lng}`
              : (() => {
                  const p =
                    coerceGeo(editingStation.geo) ??
                    parseDegreeString(form.location) ??
                    parseCommaLatLng(form.location);
                  return p ? `${p.lat}, ${p.lng}` : '';
                })()
          }
          readOnly={useCurrentPos || !!coords}
          onChange={(e) => handleLatLngInput(e.target.value)}
        />

        {/* Toạ độ hiển thị đẹp (read-only) */}
        <Input
          placeholder={t('rental_station_form.coordinates')}
          value={
            (() => {
              const p =
                gpsCoords ??
                (coords && !useCurrentPos ? coords : null) ??
                parseDegreeString(form.location) ??
                coerceGeo(editingStation.geo);
              if (p) return toCoordString(p.lat, p.lng);
              return form.location || '';
            })()
          }
          readOnly
        />

        {/* Vehicle type (optional theo type) */}
        <select
          className="w-full border rounded px-3 py-2"
          value={form.vehicleType || ''}
          onChange={(e) => handleChange('vehicleType', e.target.value as any)}
        >
          <option value="">{t('rental_station_form.select_vehicle_type', 'Chọn loại phương tiện')}</option>
          <option value="bike">{t('rental_shop_form.vehicle_bike', 'Xe đạp')}</option>
          <option value="motorbike">{t('rental_shop_form.vehicle_motorbike', 'Xe máy')}</option>
          <option value="car">{t('rental_shop_form.vehicle_car', 'Ô tô')}</option>
        </select>

        {/* Status (optional theo type) */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            {t('rental_station_form.status_label')}:
          </label>
          <select
            value={form.status || 'active'}
            onChange={(e) => handleChange('status', e.target.value as StationStatus)}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="active">✅ {t('rental_station_form.status_active')}</option>
            <option value="inactive">🚫 {t('rental_station_form.status_inactive')}</option>
          </select>
        </div>

        {/* Trạng thái geocode */}
        {!useCurrentPos && geoLoading && (
          <p className="text-sm text-gray-500">{t('rental_station_form.detecting_coords')}</p>
        )}
        {!useCurrentPos && geoError && (
          <p className="text-sm text-red-500">{geoError}</p>
        )}

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

        {/* Map preview */}
        {previewCoords && (
          <iframe
            title="Map Preview"
            width="100%"
            height="200"
            className="rounded-xl"
            style={{ border: 0 }}
            loading="lazy"
            allowFullScreen
            src={`https://www.google.com/maps?q=${previewCoords.lat},${previewCoords.lng}&hl=vi&z=16&output=embed`}
          />
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            {t('rental_station_form.actions.cancel')}
          </Button>
          <Button
            onClick={handleUpdate}
            disabled={saving}
            className="bg-[#00d289] text-white hover:bg-[#00b67a]"
          >
            {saving ? t('rental_station_form.saving', 'Đang lưu...') : t('rental_station_form.actions.save_changes')}
          </Button>
        </div>
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
