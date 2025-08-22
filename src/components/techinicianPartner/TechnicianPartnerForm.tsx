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

// ===== Legacy type để đọc dữ liệu cũ =====
type LegacyData = TechnicianPartner & {
  workingHours?: { isWorking?: boolean; startTime?: string; endTime?: string }[];
  workingStartTime?: string;
  workingEndTime?: string;
  mapAddress?: string;
  coordinates?: { lat?: number; lng?: number } | null;
};

  // ⬇️ Thêm kiểu payload cho Form (location “lite”)
  type SavePayload = Partial<
    Omit<TechnicianPartner, 'location'> & {
      // location ở layer Form chỉ gửi những gì người dùng nhập
      location?: Partial<Pick<LocationCore, 'address' | 'location'>>;
      email?: string;
      password?: string;
      role: 'technician_partner';
    }
  >;

  interface Props {
    initialData?: Partial<TechnicianPartner>;
    onSave: (data: SavePayload) => Promise<void>; // ⬅️ nới type ở đây
  }


// 🧹 Bỏ toàn bộ undefined (đệ quy)
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

// "lat,lng" -> {lat,lng}
function parseLatLngString(s?: string): { lat: number; lng: number } | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export default function TechnicianPartnerForm({ initialData, onSave }: Props) {
  const { t } = useTranslation<'common'>('common');

  const isEditMode = !!initialData?.id;
  const [submitting, setSubmitting] = useState(false);

  // ❗️Loại bỏ location gốc để không bị yêu cầu GeoPoint
  type FormShape = Partial<
  Omit<TechnicianPartner, 'location'>
  > & {
    email?: string;
    password?: string;
    role: 'technician_partner';              // vẫn required
    workingStartTime?: string;
    workingEndTime?: string;
    location?: Partial<Pick<LocationCore, 'address' | 'location'>>;
  };

  const [formData, setFormData] = useState<FormShape>(() => ({
    role: 'technician_partner',
    type: 'mobile',
    isActive: true,
    assignedRegions: [],
    serviceCategories: [],
    workingStartTime: '',
    workingEndTime: '',
    location: { address: '', location: '' }, // “lite”
    // các trường khác để trống khi chưa có dữ liệu
    name: '',
    phone: '',
    email: '',
    password: '',
    shopName: '',
    shopAddress: '',
    vehicleType: 'motorbike',
  }));


  const { geocode, coords } = useGeocodeAddress();

  // Options dịch qua i18n
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

  // ===== Khởi tạo formData (legacy-safe) =====
  useEffect(() => {
    const legacy = (initialData || {}) as LegacyData;
    const firstWorking = legacy.workingHours?.find?.((d) => d?.isWorking);

    // dựng location “lite” từ dữ liệu cũ nếu có
    const legacyLocation: Partial<LocationCore> = {};
    if (legacy.mapAddress) legacyLocation.address = legacy.mapAddress;
    if (legacy.coordinates && Number.isFinite(legacy.coordinates.lat) && Number.isFinite(legacy.coordinates.lng)) {
      legacyLocation.location = `${legacy.coordinates.lat},${legacy.coordinates.lng}`;
    } else if (legacy.location?.location) {
      legacyLocation.location = legacy.location.location;
    }
    if (legacy.location?.address && !legacyLocation.address) {
      legacyLocation.address = legacy.location.address;
    }

    // ❗️Không spread toàn bộ legacy để tránh kéo theo location gốc
    setFormData({
      id: legacy.id,
      userId: legacy.userId,
      name: legacy.name ?? '',
      phone: legacy.phone ?? '',
      email: (legacy as any).email ?? '',
      shopName: legacy.shopName ?? '',
      shopAddress: legacy.shopAddress ?? '',
      type: legacy.type ?? 'mobile',
      assignedRegions: Array.isArray(legacy.assignedRegions) ? legacy.assignedRegions : [],
      serviceCategories: Array.isArray(legacy.serviceCategories) ? legacy.serviceCategories : [],
      vehicleType: legacy.vehicleType ?? 'motorbike',
      isActive: legacy.isActive ?? true,
      workingStartTime: legacy.workingStartTime ?? firstWorking?.startTime ?? '',
      workingEndTime: legacy.workingEndTime ?? firstWorking?.endTime ?? '',
      password: '',
      role: 'technician_partner', 
      location: {
        address: legacyLocation.address ?? '',
        location: legacyLocation.location ?? '',
      },
    });
  }, [initialData]);

  // Update tọa độ khi geocode xong -> ghi vào location.location = "lat,lng"
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

  const updateLocationField = useCallback((key: 'address' | 'location', value: string) => {
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
      location: { address: '', location: '' },
      name: '',
      phone: '',
      email: '',
      password: '',
      role: 'technician_partner',     
      serviceCategories: [],
      shopName: '',
      shopAddress: '',
      isActive: true,
      workingStartTime: '',
      workingEndTime: '',
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

        // Chuẩn hoá "lat,lng" lần cuối
        const parsed = parseLatLngString(formData.location?.location);
        const locationOut: Partial<LocationCore> | undefined =
          formData.location && (formData.location.address || parsed)
            ? {
                address: formData.location.address || undefined,
                location: parsed ? `${parsed.lat},${parsed.lng}` : undefined,
                // GeoPoint/updatedAt sẽ được thêm ở layer repo/service khi lưu
              }
            : undefined;

        const payload: SavePayload = stripUndefinedDeep({
          ...formData,
          name: (formData.name || '').trim(),
          phone: (formData.phone || '').trim(),
          email: (formData.email || '')?.trim() || undefined,
          password: (formData.password || '')?.trim() || undefined,
          shopName: (formData.shopName || '')?.trim() || undefined,
          shopAddress: (formData.shopAddress || '')?.trim() || undefined,
          role: 'technician_partner' as const,
          workingStartTime: formData.workingStartTime || '',
          workingEndTime: formData.workingEndTime || '',
          // ⬇️ location “lite”: address / "lat,lng" (không có geo)
          location: locationOut,
          // dọn legacy
          workingHours: undefined as any,
          coordinates: undefined as any,
          mapAddress: undefined as any,
        });
        await onSave(payload);
        if (!isEditMode) resetForm();
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, formData, isEditMode, onSave, resetForm]
  );

  // Preview map từ location.location
  const previewCoords = useMemo(
    () => parseLatLngString(formData.location?.location || ''),
    [formData.location?.location]
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <Input
          placeholder={t('technician_partner_form.email_for_login')}
          value={formData.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
        />
        <Input
          placeholder={t('technician_partner_form.password_for_login')}
          type="password"
          value={formData.password || ''}
          onChange={(e) => updateField('password', e.target.value)}
        />

        <div>
          <label className="block text-sm font-medium mb-1">
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
            {/* Địa chỉ bản đồ -> location.address */}
            <Textarea
              placeholder={t('technician_partner_form.map_address_hint')}
              value={formData.location?.address || ''}
              onChange={(e) => updateLocationField('address', e.target.value)}
              onBlur={handleGeocode}
            />
            {/* Tọa độ -> location.location ("lat,lng") */}
            <Input
              placeholder={t('technician_partner_form.coordinates_placeholder')}
              value={formData.location?.location || ''}
              onChange={(e) => parseCoordinates(e.target.value)}
            />
            <Input
              placeholder={t('technician_partner_form.shop_address')}
              value={formData.shopAddress || ''}
              onChange={(e) => updateField('shopAddress', e.target.value)}
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
          onChange={(e) => {
            const regions = e.target.value.split('\n').map((r) => r.trim()).filter(Boolean);
            updateField('assignedRegions', regions);
          }}
        />
      </div>

      <div>
        <label className="font-medium block mb-1">{t('technician_partner_form.service_categories')}</label>
        <Select
          isMulti
          options={serviceOptions}
          value={serviceOptions.filter((opt) => (formData.serviceCategories || []).includes(opt.value))}
          onChange={(selected) => {
            const selectedOptions = (selected || []) as { label: string; value: string }[];
            updateField(
              'serviceCategories',
              selectedOptions.map((s) => s.value)
            );
          }}
        />
      </div>

      {/* ⏰ Working time: simplified (global start/end) */}
      <div>
        <label className="font-medium block mb-2">{t('technician_partner_form.working_time')}</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="flex-1">
            <label className="block text-xs font-medium">
              {t('technician_partner_form.start_time')}
            </label>
            <input
              type="time"
              step="60"
              value={formData.workingStartTime || ''}
              className="w-full border rounded px-2 py-1"
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
              className="w-full border rounded px-2 py-1"
              onChange={(e) => updateField('workingEndTime', e.target.value)}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">{t('technician_partner_form.working_time_note')}</p>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          className="form-checkbox"
          checked={!!formData.isActive}
          onChange={(e) => updateField('isActive', e.target.checked)}
        />
        <label className="text-sm font-medium">{t('technician_partner_form.is_active')}</label>
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
