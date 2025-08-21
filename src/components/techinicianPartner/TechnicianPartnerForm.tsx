'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { SimpleSelect } from '@/src/components/ui/select';
import dynamic from 'next/dynamic';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useTranslation } from 'react-i18next';

const Select = dynamic(() => import('react-select'), { ssr: false });

// ===== Legacy type để đọc dữ liệu cũ (có workingHours) =====
type LegacyData = TechnicianPartner & {
  workingHours?: { isWorking?: boolean; startTime?: string; endTime?: string }[];
  workingStartTime?: string;
  workingEndTime?: string;
};

interface Props {
  initialData?: Partial<TechnicianPartner>;
  onSave: (
    data: Partial<TechnicianPartner & { email?: string; password?: string; role: 'technician_partner' }>
  ) => Promise<void>;
}

// 🧹 Bỏ toàn bộ undefined (đệ quy)
function stripUndefinedDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
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

// ✅ Helper: hợp lệ hoá toạ độ
function normalizeCoords(input: any): { lat: number; lng: number } | null {
  const lat = Number(input?.lat);
  const lng = Number(input?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  return null;
}

export default function TechnicianPartnerForm({ initialData, onSave }: Props) {
  const { t } = useTranslation<'common'>('common');

  const isEditMode = !!initialData?.id;
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<
    Partial<
      TechnicianPartner & {
        email?: string;
        password?: string;
        role: 'technician_partner';
        workingStartTime?: string; // HH:mm
        workingEndTime?: string; // HH:mm
      }
    >
  >({});

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

    setFormData({
      ...legacy,
      // chuẩn hoá mảng/rỗng
      assignedRegions: Array.isArray(legacy.assignedRegions) ? legacy.assignedRegions : [],
      type: legacy.type ?? 'mobile',
      mapAddress: legacy.mapAddress ?? '',
      // 🔒 không để undefined: chỉ {lat,lng} hoặc null
      coordinates: normalizeCoords(legacy.coordinates),
      isActive: legacy.isActive ?? true,
      // Ưu tiên trường mới; fallback từ workingHours cũ
      workingStartTime: legacy.workingStartTime ?? firstWorking?.startTime ?? '',
      workingEndTime: legacy.workingEndTime ?? firstWorking?.endTime ?? '',
      // KHÔNG ép email/password nếu không có
      email: legacy.email ?? '',
      password: '',
    });
  }, [initialData]);

  // Update toạ độ khi geocode xong
  useEffect(() => {
    if (coords) {
      const c = normalizeCoords(coords);
      if (c) setFormData((prev) => ({ ...prev, coordinates: c }));
    }
  }, [coords]);

  const updateField = useCallback(
    (field: keyof typeof formData, value: unknown) => {
      setFormData((prev) => ({ ...prev, [field]: value as any }));
    },
    []
  );

  const handleRegionInput = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const regions = e.target.value.split('\n').map((r) => r.trim()).filter(Boolean);
      updateField('assignedRegions', regions);
    },
    [updateField]
  );

  const handleGeocode = useCallback(() => {
    const addr = (formData.mapAddress || '').trim();
    if (addr) geocode(addr);
  }, [formData.mapAddress, geocode]);

  const parseCoordinates = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) {
        // người dùng xoá -> đặt null (KHÔNG để undefined)
        updateField('coordinates', null);
        return;
      }
      const [latStr, lngStr] = text.split(',').map((p) => p.trim());
      const lat = Number(latStr);
      const lng = Number(lngStr);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        updateField('coordinates', { lat, lng });
      } else {
        // nhập sai -> không cập nhật (giữ giá trị hiện tại)
      }
    },
    [updateField]
  );

  const resetForm = useCallback(() => {
    setFormData({
      assignedRegions: [],
      type: 'mobile',
      mapAddress: '',
      coordinates: null, // 🚫 không để undefined
      name: '',
      phone: '',
      email: '',
      password: '',
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

        // Chuẩn hoá coordinates lần cuối
        const coordsFinal = normalizeCoords(formData.coordinates);
        // payload KHÔNG có undefined
        const payload = stripUndefinedDeep({
          ...formData,
          name: (formData.name || '').trim(),
          phone: (formData.phone || '').trim(),
          email: (formData.email || '')?.trim() || undefined, // nếu rỗng -> bỏ
          password: (formData.password || '')?.trim() || undefined,
          shopName: (formData.shopName || '').trim() || undefined,
          shopAddress: (formData.shopAddress || '').trim() || undefined,
          mapAddress: (formData.mapAddress || '').trim() || undefined,
          role: 'technician_partner' as const,
          workingStartTime: formData.workingStartTime || '',
          workingEndTime: formData.workingEndTime || '',
          // ✅ chỉ {lat,lng} hoặc null; KHÔNG để undefined
          coordinates: coordsFinal, // nếu không hợp lệ sẽ là null
        });

        // Không lưu field cũ
        // @ts-ignore
        delete (payload as any).workingHours;

        await onSave(payload);
        if (!isEditMode) resetForm();
      } finally {
        setSubmitting(false);
      }
    },
    [canSubmit, formData, isEditMode, onSave, resetForm]
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
            <Textarea
              placeholder={t('technician_partner_form.map_address_hint')}
              value={formData.mapAddress || ''}
              onChange={(e) => updateField('mapAddress', e.target.value)}
              onBlur={handleGeocode}
            />
            <Input
              placeholder={t('technician_partner_form.coordinates_placeholder')}
              value={
                formData.coordinates ? `${formData.coordinates.lat}, ${formData.coordinates.lng}` : ''
              }
              readOnly={!!coords}
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

      {formData.type === 'shop' && formData.coordinates && (
        <>
          <p className="text-sm text-gray-600">
            {t('technician_partner_form.detected_coords', {
              lat: String(formData.coordinates.lat),
              lng: String(formData.coordinates.lng),
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
            src={`https://www.google.com/maps?q=${formData.coordinates.lat},${formData.coordinates.lng}&hl=vi&z=16&output=embed`}
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
