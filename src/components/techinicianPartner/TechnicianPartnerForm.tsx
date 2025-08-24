'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { SimpleSelect } from '@/src/components/ui/select';
import dynamic from 'next/dynamic';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useTranslation } from 'react-i18next';

const Select = dynamic(() => import('react-select'), { ssr: false });

// ===== Helpers =====
type LatLng = { lat: number; lng: number };
type MaybeLatLng = { lat?: number; lng?: number } | null | undefined;

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}
function hasFiniteLatLng(v: MaybeLatLng): v is LatLng {
  return !!v && isFiniteNumber(v.lat) && isFiniteNumber(v.lng);
}
function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

// ===== Legacy-safe cho seed form (không ghi ra DB) =====
type LegacyData = TechnicianPartner & {
  workingHours?: { isWorking?: boolean; startTime?: string; endTime?: string }[];
  workingStartTime?: string;
  workingEndTime?: string;
  coordinates?: { lat?: number; lng?: number } | null;
};

// Payload gửi ra ngoài (form “lite” – không có GeoPoint/updatedAt)
type SavePayload = Partial<
  Omit<TechnicianPartner, 'location'> & {
    location?: Partial<Pick<LocationCore, 'address' | 'location' | 'mapAddress'>>;
    role: 'technician_partner';
  }
>;

interface Props {
  initialData?: Partial<TechnicianPartner>;
  onSave: (data: SavePayload) => Promise<void>;
}

// 🧹 Dọn undefined đệ quy
function stripUndefinedDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj as T;
  if (Array.isArray(obj)) {
    return obj.map(stripUndefinedDeep).filter((v) => v !== undefined) as unknown as T;
  }
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj as Record<string, any>)) {
    if (v === undefined) continue;
    out[k] = stripUndefinedDeep(v);
  }
  return out as T;
}

export default function TechnicianPartnerForm({ initialData, onSave }: Props) {
  const { t } = useTranslation<'common'>('common');
  const isEditMode = !!initialData?.id;
  const [submitting, setSubmitting] = useState(false);

  type FormShape = Partial<Omit<TechnicianPartner, 'location'>> & {
    role: 'technician_partner';
    workingStartTime?: string;
    workingEndTime?: string;
    // “lite” location, chỉ address/location/mapAddress (string)
    location?: Partial<Pick<LocationCore, 'address' | 'location' | 'mapAddress'>>;
  };

  const [formData, setFormData] = useState<FormShape>(() => ({
    role: 'technician_partner',
    type: 'mobile',
    isActive: true,
    assignedRegions: [],
    serviceCategories: [],
    workingStartTime: '',
    workingEndTime: '',
    location: { address: '', location: '', mapAddress: '' },
    name: '',
    phone: '',
    shopName: '',
    vehicleType: 'motorbike',
  }));

  const { geocode, coords } = useGeocodeAddress();

  const serviceOptions = useMemo(
    () => [
      { label: t('technician_partner_form.service.battery', { defaultValue: 'Battery' }), value: 'battery' },
      { label: t('technician_partner_form.service.brake', { defaultValue: 'Brake' }), value: 'brake' },
      { label: t('technician_partner_form.service.flat_tire', { defaultValue: 'Flat Tire' }), value: 'flat_tire' },
      { label: t('technician_partner_form.service.motor', { defaultValue: 'Motor' }), value: 'motor' },
      { label: t('technician_partner_form.service.electrical', { defaultValue: 'Electrical' }), value: 'electrical' },
    ],
    [t]
  );

  // ===== Seed form từ initialData (legacy-safe) =====
  useEffect(() => {
    const legacy = (initialData || {}) as LegacyData;
    const firstWorking = legacy.workingHours?.find?.((d) => d?.isWorking);

    const legacyLoc: Partial<LocationCore> = {};
    // Ưu tiên string có sẵn
    if (legacy.location?.location) legacyLoc.location = legacy.location.location;
    if (legacy.location?.address) legacyLoc.address = legacy.location.address;
    if ((legacy.location as any)?.mapAddress) legacyLoc.mapAddress = (legacy.location as any).mapAddress;
    // Rớt xuống coordinates (legacy)
    type LegacyData = Omit<
      TechnicianPartner,
      'coordinates' | 'mapAddress' | 'geo' | 'workingHours'
    > & {
      // các field legacy có thể vẫn còn trong doc cũ
      coordinates?: { lat?: number; lng?: number } | null;
      mapAddress?: string;
      geo?: { lat?: number; lng?: number } | null;
      workingHours?: { isWorking?: boolean; startTime?: string; endTime?: string }[];
    };

    // Helpers
      type LatLng = { lat: number; lng: number };
      type MaybeLatLng = { lat?: number; lng?: number } | null | undefined;
      const isFiniteNumber = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
      const hasFiniteLatLng = (v: MaybeLatLng): v is LatLng => !!v && isFiniteNumber(v.lat) && isFiniteNumber(v.lng);

      // Rớt xuống coordinates (legacy)
      if (!legacyLoc.location) {
        const coords = legacy.coordinates ?? legacy.geo; // <-- giờ không còn là never
        if (hasFiniteLatLng(coords)) {
          legacyLoc.location = `${coords.lat},${coords.lng}`;
        }
      }


    setFormData({
      id: legacy.id,
      userId: legacy.userId,
      name: legacy.name ?? '',
      phone: legacy.phone ?? '',
      shopName: legacy.shopName ?? '',
      type: legacy.type ?? 'mobile',
      assignedRegions: Array.isArray(legacy.assignedRegions) ? legacy.assignedRegions : [],
      serviceCategories: Array.isArray(legacy.serviceCategories) ? legacy.serviceCategories : [],
      vehicleType: legacy.vehicleType ?? 'motorbike',
      isActive: legacy.isActive ?? true,
      workingStartTime: legacy.workingStartTime ?? firstWorking?.startTime ?? '',
      workingEndTime: legacy.workingEndTime ?? firstWorking?.endTime ?? '',
      role: 'technician_partner',
      location: {
        address: legacyLoc.address ?? '',
        location: legacyLoc.location ?? '',
        mapAddress: legacyLoc.mapAddress ?? '',
      },
    });
  }, [initialData]);

  // Geocode từ address -> cập nhật location.location (lat,lng)
  useEffect(() => {
    if (!coords) return;
    setFormData((prev) => ({
      ...prev,
      location: {
        ...(prev.location || {}),
        location: `${coords.lat},${coords.lng}`,
      },
    }));
  }, [coords]);

  const updateField = useCallback(
    (field: keyof FormShape, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value as any }));
    },
    []
  );

  const updateLocationField = useCallback((key: 'address' | 'location' | 'mapAddress', value: string) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...(prev.location || {}),
        [key]: value,
      },
    }));
  }, []);

  const handleRegionInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const regions = e.target.value.split('\n').map((r) => r.trim()).filter(Boolean);
      updateField('assignedRegions', regions);
    },
    [updateField]
  );

  const handleGeocode = useCallback(() => {
    const addr = (formData.location?.address || '').trim();
    if (addr) geocode(addr);
  }, [formData.location?.address, geocode]);

  const parseCoordinates = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) {
        updateLocationField('location', '');
        return;
      }
      const parsed = parseLatLngString(text);
      if (parsed) {
        updateLocationField('location', `${parsed.lat},${parsed.lng}`);
      }
    },
    [updateLocationField]
  );

  const resetForm = useCallback(() => {
    setFormData({
      assignedRegions: [],
      type: 'mobile',
      location: { address: '', location: '', mapAddress: '' },
      name: '',
      phone: '',
      role: 'technician_partner',
      serviceCategories: [],
      shopName: '',
      isActive: true,
      workingStartTime: '',
      workingEndTime: '',
      vehicleType: 'motorbike',
    });
  }, []);

  const canSubmit = useMemo(() => {
    const nameOk = (formData.name || '').trim().length > 0;
    const phoneOk = (formData.phone || '').trim().length > 0;
    return nameOk && phoneOk && !submitting;
  }, [formData.name, formData.phone, submitting]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      try {
        setSubmitting(true);

        // Chuẩn hoá "lat,lng" lần cuối (string)
        const parsed = parseLatLngString(formData.location?.location);
        const locationOut: SavePayload['location'] =
          formData.location && (formData.location.address || formData.location.mapAddress || parsed)
            ? {
                address: formData.location.address || undefined,
                mapAddress: formData.location.mapAddress || undefined,
                location: parsed ? `${parsed.lat},${parsed.lng}` : undefined,
              }
            : undefined;

        const payload: SavePayload = stripUndefinedDeep({
          // giữ các field hợp lệ theo schema
          id: formData.id,
          userId: formData.userId,
          name: (formData.name || '').trim(),
          phone: (formData.phone || '').trim(),
          shopName: (formData.shopName || '')?.trim() || undefined,
          type: formData.type || 'mobile',
          assignedRegions: formData.assignedRegions,
          serviceCategories: formData.serviceCategories,
          vehicleType: formData.vehicleType,
          isActive: !!formData.isActive,
          workingStartTime: formData.workingStartTime || '',
          workingEndTime: formData.workingEndTime || '',
          role: 'technician_partner',
          location: locationOut,
          // dọn legacy (không gửi ra)
          workingHours: undefined as any,
          coordinates: undefined as any,
        });

        await onSave(payload);
        if (!isEditMode) resetForm();
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, formData, isEditMode, onSave, resetForm]
  );

  const previewCoords = useMemo(
    () => parseLatLngString(formData.location?.location || ''),
    [formData.location?.location]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input
          placeholder={t('technician_partner_form.name')}
          value={formData.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
        />
        <Input
          placeholder={t('technician_partner_form.phone')}
          value={formData.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
        />

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('technician_partner_form.technician_type')}
          </label>
          <SimpleSelect
            placeholder={t('technician_partner_form.select_type')}
            options={[
              { label: t('technician_partner_form.type.shop'), value: 'shop' },
              { label: t('technician_partner_form.type.mobile'), value: 'mobile' },
            ]}
            value={formData.type || ''}
            onChange={(val: string) => updateField('type', val)}
          />
        </div>

        {/* 🏪 Shop-only fields */}
        {formData.type === 'shop' && (
          <>
            <Input
              placeholder={t('technician_partner_form.shop_name')}
              value={formData.shopName || ''}
              onChange={(e) => updateField('shopName', e.target.value)}
            />
            {/* Địa chỉ hiển thị → location.address */}
            <Textarea
              placeholder={t('technician_partner_form.shop_address')}
              value={formData.location?.address || ''}
              onChange={(e) => updateLocationField('address', e.target.value)}
              onBlur={handleGeocode}
            />
            {/* Link Google Maps (optional) → location.mapAddress */}
            <Input
              placeholder={t('technician_partner_form.map_address_hint')}
              value={formData.location?.mapAddress || ''}
              onChange={(e) => updateLocationField('mapAddress', e.target.value)}
            />
            {/* Tọa độ → location.location ("lat,lng") */}
            <Input
              placeholder={t('technician_partner_form.coordinates_placeholder')}
              value={formData.location?.location || ''}
              onChange={(e) => parseCoordinates(e.target.value)}
            />
          </>
        )}
      </div>

      {formData.type === 'shop' && previewCoords && (
        <>
          <p className="text-sm text-gray-600">
            {t('technician_partner_form.detected_coords', {
              lat: String(previewCoords.lat),
              lng: String(previewCoords.lng),
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
            src={`https://www.google.com/maps?q=${previewCoords.lat},${previewCoords.lng}&hl=vi&z=16&output=embed`}
          />
        </>
      )}

      <div>
        <label className="font-medium">{t('technician_partner_form.assigned_regions_label')}</label>
        <Textarea
          rows={4}
          placeholder={t('technician_partner_form.assigned_regions_placeholder')}
          value={(formData.assignedRegions || []).join('\n')}
          onChange={handleRegionInput}
        />
      </div>

      <div>
        <label className="mb-1 block font-medium">
          {t('technician_partner_form.service_categories')}
        </label>
        <Select
          isMulti
          options={serviceOptions}
          value={serviceOptions.filter((opt) =>
            (formData.serviceCategories || []).includes(opt.value)
          )}
          onChange={(selected) => {
            const selectedOptions = (selected || []) as { label: string; value: string }[];
            updateField(
              'serviceCategories',
              selectedOptions.map((s) => s.value)
            );
          }}
        />
      </div>

      {/* ⏰ Working time */}
      <div>
        <label className="mb-2 block font-medium">
          {t('technician_partner_form.working_time')}
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex-1">
            <label className="block text-xs font-medium">
              {t('technician_partner_form.start_time')}
            </label>
            <input
              type="time"
              step="60"
              value={formData.workingStartTime || ''}
              className="w-full rounded border px-2 py-1"
              onChange={(e) => updateField('workingStartTime', e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium">
              {t('technician_partner_form.end_time')}
            </label>
            <input
              type="time"
              step="60"
              value={formData.workingEndTime || ''}
              className="w-full rounded border px-2 py-1"
              onChange={(e) => updateField('workingEndTime', e.target.value)}
            />
          </div>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {t('technician_partner_form.working_time_note')}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="form-checkbox"
          checked={!!formData.isActive}
          onChange={(e) => updateField('isActive', e.target.checked)}
        />
        <label className="text-sm font-medium">
          {t('technician_partner_form.is_active')}
        </label>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        {submitting
          ? t('common_actions.processing', { defaultValue: 'Processing…' })
          : isEditMode
          ? t('technician_partner_form.update_btn')
          : t('technician_partner_form.create_btn')}
      </Button>
    </form>
  );
}
