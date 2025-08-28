'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import type { TechnicianPartner, VehicleType } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useTranslation } from 'react-i18next';
import {
  MapPin, Navigation, Phone, User2, Store, Clock, Wrench, Car, Bike, Siren
} from 'lucide-react';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

/* ===================== Helpers ===================== */
type LatLng = { lat: number; lng: number };

function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** Lấy lat,lng từ URL Google Maps: “…/@lat,lng,…” hoặc “…?q=lat,lng|query|ll=lat,lng …” */
function parseLatLngFromMapUrl(url?: string): LatLng | null {
  if (!url) return null;
  try {
    const mAt = url.match(/@(-?\d+(\.\d+)?),(-?\d+(\.\d+)?)(,|$)/);
    if (mAt) {
      const lat = parseFloat(mAt[1]);
      const lng = parseFloat(mAt[3]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    }
    const u = new URL(url);
    for (const key of ['q', 'query', 'll']) {
      const v = u.searchParams.get(key);
      const m = v?.match?.(/(-?\d+(\.\d+)?),\s*(-?\d+(\.\d+)?)/);
      if (m) {
        const lat = parseFloat(m[1]);
        const lng = parseFloat(m[3]);
        if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
      }
    }
    return parseLatLngString(url);
  } catch {
    return null;
  }
}

/** HH:MM -> minutes (invalid -> null) */
function parseTimeToMinutes(t: string): number | null {
  if (typeof t !== 'string') return null;
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Dọn undefined (deep) */
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

/* ===================== Types ===================== */
type FormLocation = {
  address?: string;
  mapAddress?: string;
  location?: string; // "lat,lng"
};

type FormState = {
  id?: string;
  userId?: string;
  role: 'technician_partner';
  type: 'shop' | 'mobile';
  name: string;
  phone: string;
  shopName?: string;
  assignedRegions: string[];
  serviceCategories: string[];
  vehicleType: VehicleType;
  isActive: boolean;
  workingStartTime: string;
  workingEndTime: string;
  averageRating: number;
  ratingCount: number;
  avatarUrl?: string | null;

  location: FormLocation;

  _lat?: string;
  _lng?: string;
};

/** Payload form trả cho parent (lite-location) */
export type SavePayload = Partial<
  Omit<TechnicianPartner, 'location'> & {
    location?: Partial<Pick<LocationCore, 'address' | 'location' | 'mapAddress'>>;
    role: 'technician_partner';
  }
>;

interface Props {
  initialData?: Partial<TechnicianPartner>;
  onSave: (data: SavePayload) => Promise<void>;
}

/* ===================== Component ===================== */
export default function TechnicianPartnerForm({ initialData, onSave }: Props) {
  const { t } = useTranslation('common');
  const { coords, geocode } = useGeocodeAddress();
  const geocodeRef = useRef(geocode);
  geocodeRef.current = geocode;

  const [form, setForm] = useState<FormState>({
    role: 'technician_partner',
    type: 'shop',
    name: '',
    phone: '',
    shopName: '',
    location: { address: '', location: '', mapAddress: '' },
    assignedRegions: [],
    serviceCategories: [],
    vehicleType: 'motorbike',
    isActive: false,
    workingStartTime: '',
    workingEndTime: '',
    averageRating: 0,
    ratingCount: 0,
  });

  const [submitting, setSubmitting] = useState(false);
  const [workingTimeError, setWorkingTimeError] = useState('');

  /* ---------- Seed from initialData ---------- */
  useEffect(() => {
    if (!initialData) return;
    const loc = (initialData.location as any) ?? {};
    const p = parseLatLngString(loc?.location);
    setForm((prev) => ({
      ...prev,
      id: initialData.id,
      userId: initialData.userId,
      role: 'technician_partner',
      type: initialData.type ?? 'shop',
      name: initialData.name ?? '',
      phone: initialData.phone ?? '',
      shopName: initialData.shopName ?? '',
      assignedRegions: Array.isArray(initialData.assignedRegions) ? initialData.assignedRegions : [],
      serviceCategories: Array.isArray(initialData.serviceCategories) ? initialData.serviceCategories : [],
      vehicleType: initialData.vehicleType ?? 'motorbike',
      isActive: !!initialData.isActive,
      workingStartTime: initialData.workingStartTime ?? '',
      workingEndTime: initialData.workingEndTime ?? '',
      averageRating: Number(initialData.averageRating ?? 0),
      ratingCount: Number(initialData.ratingCount ?? 0),
      avatarUrl: initialData.avatarUrl ?? null,
      location: {
        address: loc.address ?? '',
        mapAddress: loc.mapAddress ?? '',
        location: loc.location ?? '',
      },
      _lat: p ? String(p.lat) : '',
      _lng: p ? String(p.lng) : '',
    }));
  }, [initialData]);

  /* ---------- Auto resolve mapAddress/address -> location.location ---------- */
  useEffect(() => {
    const raw = form.location.mapAddress?.trim() || form.location.address?.trim();
    if (!raw) return;

    const setPos = (lat: number, lng: number) => {
      const latStr = String(lat);
      const lngStr = String(lng);
      const locStr = `${lat},${lng}`;
      setForm((prev) => {
        if (prev._lat === latStr && prev._lng === lngStr && prev.location.location === locStr) return prev;
        return {
          ...prev,
          _lat: latStr,
          _lng: lngStr,
          location: { ...prev.location, location: locStr },
        };
      });
    };

    const byPair = parseLatLngString(raw);
    if (byPair) { setPos(byPair.lat, byPair.lng); return; }
    const byUrl = parseLatLngFromMapUrl(raw);
    if (byUrl) { setPos(byUrl.lat, byUrl.lng); return; }

    const id = setTimeout(() => geocodeRef.current(raw), 300);
    return () => clearTimeout(id);
  }, [form.location.mapAddress, form.location.address]);

  /* ---------- Apply geocode coords ---------- */
  useEffect(() => {
    if (!coords) return;
    const locStr = `${coords.lat},${coords.lng}`;
    setForm((prev) => {
      if (prev.location.location === locStr && prev._lat === String(coords.lat) && prev._lng === String(coords.lng)) {
        return prev;
      }
      return {
        ...prev,
        _lat: String(coords.lat),
        _lng: String(coords.lng),
        location: { ...prev.location, location: locStr },
      };
    });
  }, [coords]);

  /* ---------- Updaters ---------- */
  const setField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const setLocationField = useCallback((key: keyof FormLocation, value: string) => {
    setForm((prev) => ({ ...prev, location: { ...prev.location, [key]: value } }));
  }, []);

  const updateWorkingTimeField = useCallback(
    (key: 'workingStartTime' | 'workingEndTime', value: string) => {
      setForm((prev) => {
        const next = { ...prev, [key]: value };
        const s = next.workingStartTime || '';
        const e = next.workingEndTime || '';
        let err = '';
        if (s && !parseTimeToMinutes(s)) err = 'Invalid start time';
        if (!err && e && !parseTimeToMinutes(e)) err = 'Invalid end time';
        if (!err && s && e) {
          const sm = parseTimeToMinutes(s)!;
          const em = parseTimeToMinutes(e)!;
          if (em <= sm) err = 'End must be after start';
        }
        setWorkingTimeError(err);
        return next;
      });
    },
    []
  );

  /* ---------- Validation ---------- */
  const canSubmit = useMemo(
    () =>
      Boolean(
        (form.name || '').trim() &&
        (form.phone || '').trim() &&
        (form.location.address || '').trim() &&
        !workingTimeError
      ),
    [form.name, form.phone, form.location.address, workingTimeError]
  );

  /* ---------- Submit ---------- */
  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    // chuẩn hoá lat,lng cuối
    let lat = form._lat ? parseFloat(form._lat) : undefined;
    let lng = form._lng ? parseFloat(form._lng) : undefined;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      const parsed = parseLatLngString(form.location.location);
      if (parsed) ({ lat, lng } = parsed);
    }

    const payload: SavePayload = stripUndefined({
      id: form.id,
      userId: form.userId,
      role: 'technician_partner',
      name: form.name.trim(),
      phone: form.phone.trim(),
      type: form.type,
      shopName: form.shopName || undefined,
      assignedRegions: form.assignedRegions,
      serviceCategories: form.serviceCategories,
      vehicleType: form.vehicleType,
      isActive: form.isActive,
      workingStartTime: form.workingStartTime || '',
      workingEndTime: form.workingEndTime || '',
      averageRating: form.averageRating,
      ratingCount: form.ratingCount,
      avatarUrl: form.avatarUrl ?? null,
      location: {
        address: form.location.address || undefined,
        mapAddress: form.location.mapAddress || undefined,
        location:
          lat != null && lng != null
            ? `${lat},${lng}`
            : form.location.location || undefined,
      },
    });

    try {
      setSubmitting(true);
      await onSave(payload);
      if (!form.id) {
        // reset khi tạo mới
        setForm({
          role: 'technician_partner',
          type: 'shop',
          name: '',
          phone: '',
          shopName: '',
          location: { address: '', location: '', mapAddress: '' },
          assignedRegions: [],
          serviceCategories: [],
          vehicleType: 'motorbike',
          isActive: false,
          workingStartTime: '',
          workingEndTime: '',
          averageRating: 0,
          ratingCount: 0,
          _lat: '',
          _lng: '',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, form, onSave]);

  /* ---------- Preview coords ---------- */
  const previewLatLng: LatLng | null = useMemo(() => {
    if (
      form._lat &&
      form._lng &&
      Number.isFinite(parseFloat(form._lat)) &&
      Number.isFinite(parseFloat(form._lng))
    ) {
      return { lat: parseFloat(form._lat), lng: parseFloat(form._lng) };
    }
    const parsed = parseLatLngString(form.location.location);
    return parsed ?? null;
  }, [form._lat, form._lng, form.location.location]);

  /* ===================== UI (cards/grid + sticky bar) ===================== */
  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header card */}
      <div className="mb-4 rounded-2xl border bg-white p-4 md:p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Siren className="size-6 md:size-7 text-emerald-500" />
          <div>
            <h2 className="text-lg md:text-xl font-semibold">
              {t('repair_shop_form.title', { defaultValue: 'Add Repair Shop / Technician' })}
            </h2>
            <p className="text-xs md:text-sm text-gray-600">
              {t('repair_shop_form.subtitle', { defaultValue: 'Provide location and contact so customers can find you quickly.' })}
            </p>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left column */}
        <div className="space-y-4">
          {/* Technician Info */}
          <section className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base md:text-lg font-semibold">
              <User2 className="size-5 text-emerald-500" />
              {t('repair_shop_form.section_technician', { defaultValue: 'Technician' })}
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="relative">
                <User2 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder={t('repair_shop_form.technician_name')}
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                />
              </div>
              <div className="relative">
                <Phone className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder={t('repair_shop_form.phone_number')}
                  value={form.phone}
                  onChange={(e) => setField('phone', e.target.value)}
                />
              </div>
              <div className="relative">
                <Store className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder={t('repair_shop_form.shop_name_optional')}
                  value={form.shopName || ''}
                  onChange={(e) => setField('shopName', e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('repair_shop_form.shop_name_hint', { defaultValue: 'Leave blank if you are a mobile technician.' })}
                </p>
              </div>
            </div>
          </section>

          {/* Working Time */}
          <section className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base md:text-lg font-semibold">
              <Clock className="size-5 text-emerald-500" />
              {t('technician_partner_form.working_time')}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium">
                  {t('technician_partner_form.start_time')}
                </label>
                <input
                  type="time"
                  step="60"
                  value={form.workingStartTime}
                  className="w-full rounded border px-2 py-2"
                  onChange={(e) => updateWorkingTimeField('workingStartTime', e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">
                  {t('technician_partner_form.end_time')}
                </label>
                <input
                  type="time"
                  step="60"
                  value={form.workingEndTime}
                  className="w-full rounded border px-2 py-2"
                  onChange={(e) => updateWorkingTimeField('workingEndTime', e.target.value)}
                />
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {t('technician_partner_form.working_time_note')}
            </p>
            {workingTimeError && (
              <p className="mt-2 text-xs text-rose-600">{workingTimeError}</p>
            )}
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Location */}
          <section className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base md:text-lg font-semibold">
              <MapPin className="size-5 text-emerald-500" />
              {t('repair_shop_form.section_location', { defaultValue: 'Location' })}
            </h3>

            <div className="grid grid-cols-1 gap-3">
              {/* address */}
              <div>
                <label className="mb-1 block text-xs font-medium">
                  {t('repair_shop_form.shop_address')}
                </label>
                <Textarea
                  placeholder={t('repair_shop_form.shop_address')}
                  value={form.location.address || ''}
                  onChange={(e) => setLocationField('address', e.target.value)}
                />
              </div>

              {/* mapAddress */}
              <div className="relative">
                <Navigation className="pointer-events-none absolute left-3 top-3 size-4 text-gray-400" />
                <Input
                  className="pl-10"
                  placeholder={t('repair_shop_form.map_address')}
                  value={form.location.mapAddress || ''}
                  onChange={(e) => setLocationField('mapAddress', e.target.value)}
                />
                <p className="mt-1 text-xs text-gray-500">
                  {t('repair_shop_form.map_address_hint', {
                    defaultValue: 'Paste Google Maps link or "lat,lng". Coordinates update automatically.',
                  })}
                </p>
              </div>

              {/* one-line coords input (optional) */}
              <Input
                placeholder={t('repair_shop_form.coords_placeholder', { defaultValue: 'Coordinates (e.g., 16.07, 108.22)' })}
                value={form._lat && form._lng ? `${form._lat}, ${form._lng}` : ''}
                onChange={(e) => {
                  const value = e.target.value;
                  const m = value.match(/(-?\d+(\.\d+)?)\D+(-?\d+(\.\d+)?)/);
                  if (m) {
                    const latStr = m[1];
                    const lngStr = m[3];
                    setForm((prev) => ({
                      ...prev,
                      _lat: latStr,
                      _lng: lngStr,
                      location: { ...prev.location, location: `${latStr},${lngStr}` },
                    }));
                  } else {
                    setForm((prev) => ({ ...prev, _lat: '', _lng: '' }));
                  }
                }}
              />

              {/* Map preview */}
              {previewLatLng && (
                <div className="h-48 rounded-xl overflow-hidden border">
                  <MapPreview coords={previewLatLng} />
                </div>
              )}
            </div>
          </section>

          {/* Vehicle */}
          <section className="rounded-2xl border bg-white p-4 md:p-6 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-base md:text-lg font-semibold">
              <Wrench className="size-5 text-emerald-500" />
              {t('repair_shop_form.section_services', { defaultValue: 'Vehicle' })}
            </h3>

            <div>
              <label className="mb-1 block text-xs font-medium">
                {t('repair_shop_form.select_vehicle_type')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setField('vehicleType', 'bike')}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition
                    ${form.vehicleType === 'bike' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'hover:bg-gray-50'}`}
                >
                  <Bike className="size-4" />
                  {t('repair_shop_form.vehicle_type.bike', { defaultValue: 'Bike' })}
                </button>
                <button
                  type="button"
                  onClick={() => setField('vehicleType', 'motorbike')}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition
                    ${form.vehicleType === 'motorbike' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'hover:bg-gray-50'}`}
                >
                  <MotorbikeIcon />
                  {t('repair_shop_form.vehicle_type.motorbike', { defaultValue: 'Motorbike' })}
                </button>
                <button
                  type="button"
                  onClick={() => setField('vehicleType', 'car')}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition
                    ${form.vehicleType === 'car' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'hover:bg-gray-50'}`}
                >
                  <Car className="size-4" />
                  {t('repair_shop_form.vehicle_type.car', { defaultValue: 'Car' })}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Spacer for mobile sticky bar */}
      <div className="md:hidden h-16" />

      {/* Sticky action bar (mobile) */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/70 md:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-2">
          <p className="text-xs text-gray-600">
            {t('repair_shop_form.action_hint', { defaultValue: 'Review details then submit' })}
          </p>
          <Button onClick={handleSubmit} disabled={submitting || !canSubmit} className="min-w-28">
            {submitting
              ? t('common_actions.processing', { defaultValue: 'Processing…' })
              : t('repair_shop_form.submit_repair_shop')}
          </Button>
        </div>
      </div>

      {/* Desktop action */}
      <div className="hidden md:flex items-center justify-end gap-3 pt-4">
        <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
          {submitting
            ? t('common_actions.processing', { defaultValue: 'Processing…' })
            : t('repair_shop_form.submit_repair_shop')}
        </Button>
      </div>
    </div>
  );
}

/** Icon “motorbike” đơn giản (lucide chưa có) */
function MotorbikeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19 17a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M7 14h5l3-4 2 2h3" />
    </svg>
  );
}
