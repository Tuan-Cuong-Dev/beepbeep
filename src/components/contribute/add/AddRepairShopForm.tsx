'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  addDoc,
  collection,
  serverTimestamp,
  GeoPoint,
  updateDoc,
} from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useTranslation } from 'react-i18next';
import { useContributions } from '@/src/hooks/useContributions';

type LatLng = { lat: number; lng: number };

/** Parse "lat,lng" an toàn */
function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

/** Loại bỏ toàn bộ undefined (deep). Giữ nguyên null và '' */
function stripUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof GeoPoint) return obj as T;
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

/** HH:MM -> phút, sai thì null */
function parseTimeToMinutes(t: string): number | null {
  if (typeof t !== 'string') return null;
  const m = t.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  return h * 60 + min;
}

export default function AddRepairShopForm() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const { coords, geocode } = useGeocodeAddress();
  const { submitContribution } = useContributions();

  const [form, setForm] = useState<
    Partial<TechnicianPartner> & { _lat?: string; _lng?: string }
  >({
    type: 'shop',
    name: '',
    phone: '',
    shopName: '',
    shopAddress: '',
    location: { address: '', location: '' } as any,
    assignedRegions: [],
    vehicleType: 'motorbike',
    isActive: false,
    workingStartTime: '',
    workingEndTime: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [workingTimeError, setWorkingTimeError] = useState('');

  // 🔎 Geocode khi nhập địa chỉ (debounce)
  useEffect(() => {
    const addr = (form.location as any)?.address;
    const trimmed = typeof addr === 'string' ? addr.trim() : '';
    if (!trimmed) return;
    const id = setTimeout(() => geocode(trimmed), 300);
    return () => clearTimeout(id);
  }, [(form.location as any)?.address, geocode]);

  // 📍 Khi có coords từ geocode → cập nhật preview lat/lng
  useEffect(() => {
    if (!coords) return;
    setForm((prev) => {
      const newLatStr = String(coords.lat ?? '');
      const newLngStr = String(coords.lng ?? '');
      const newLocStr = `${coords.lat},${coords.lng}`;
      const curLocStr = (prev.location as any)?.location;
      if (
        curLocStr === newLocStr &&
        prev._lat === newLatStr &&
        prev._lng === newLngStr
      ) {
        return prev;
      }
      return {
        ...prev,
        _lat: newLatStr,
        _lng: newLngStr,
        location: { ...(prev.location as any), location: newLocStr } as any,
      };
    });
  }, [coords]);

  const setField = (field: keyof TechnicianPartner, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setLocationField = (key: 'address' | 'location', value: string) =>
    setForm((prev) => ({
      ...prev,
      location: { ...(prev.location as any), [key]: value } as any,
    }));

  // validate working time khi thay đổi
  function updateWorkingTimeField(
    key: 'workingStartTime' | 'workingEndTime',
    value: string
  ) {
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
  }

  const canSubmit = useMemo(
    () =>
      Boolean(
        user?.uid && form.name && form.phone && form.shopAddress && !workingTimeError
      ),
    [user?.uid, form.name, form.phone, form.shopAddress, workingTimeError]
  );

  const handleSubmit = async () => {
    if (!canSubmit) return;

    let lat: number | undefined;
    let lng: number | undefined;
    if (form._lat && form._lng) {
      lat = parseFloat(form._lat);
      lng = parseFloat(form._lng);
    }
    if (lat === undefined || lng === undefined) {
      const parsed = parseLatLngString((form.location as any)?.location);
      if (parsed) ({ lat, lng } = parsed);
    }
    if ((lat === undefined || lng === undefined) && coords) {
      lat = coords.lat;
      lng = coords.lng;
    }

    const locationCore =
      lat !== undefined && lng !== undefined
        ? {
            geo: new GeoPoint(lat, lng),
            location: `${lat},${lng}`,
            address: (form.location as any)?.address || '',
            updatedAt: serverTimestamp(),
          }
        : undefined;

    const rawData: Partial<TechnicianPartner> = {
      userId: '',
      role: 'technician_partner',
      name: form.name!,
      phone: form.phone!,
      type: 'shop',
      shopName: form.shopName ?? '',
      shopAddress: form.shopAddress!,
      location: locationCore,
      assignedRegions: form.assignedRegions ?? [],
      serviceCategories: form.serviceCategories ?? [],
      vehicleType: form.vehicleType ?? 'motorbike',
      workingStartTime: form.workingStartTime ?? '',
      workingEndTime: form.workingEndTime ?? '',
      averageRating: 0,
      ratingCount: 0,
      isActive: false,
      createdBy: user?.uid ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      avatarUrl: form.avatarUrl ?? null,
    };

    const dataToWrite = stripUndefined(rawData);

    setSubmitting(true);
    try {
      const docRef = await addDoc(
        collection(db, 'technicianPartners'),
        dataToWrite
      );
      await updateDoc(docRef, { id: docRef.id });
      await submitContribution('repair_shop', {
        ...dataToWrite,
        id: docRef.id,
      });

      setForm({
        type: 'shop',
        name: '',
        phone: '',
        shopName: '',
        shopAddress: '',
        location: { address: '', location: '' } as any,
        assignedRegions: [],
        vehicleType: 'motorbike',
        isActive: false,
        workingStartTime: '',
        workingEndTime: '',
        _lat: '',
        _lng: '',
      });
      setShowDialog(true);
    } catch (error) {
      console.error('❌ Error submitting repair shop:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder={t('repair_shop_form.technician_name')}
        value={form.name || ''}
        onChange={(e) => setField('name', e.target.value)}
      />
      <Input
        placeholder={t('repair_shop_form.phone_number')}
        value={form.phone || ''}
        onChange={(e) => setField('phone', e.target.value)}
      />
      <Input
        placeholder={t('repair_shop_form.shop_name_optional')}
        value={form.shopName || ''}
        onChange={(e) => setField('shopName', e.target.value)}
      />
      <Textarea
        placeholder={t('repair_shop_form.shop_address')}
        value={form.shopAddress || ''}
        onChange={(e) => setField('shopAddress', e.target.value)}
      />

      <Textarea
        className="min-h-[120px]"
        placeholder={t('repair_shop_form.map_address')}
        value={(form.location as any)?.address || ''}
        onChange={(e) => setLocationField('address', e.target.value)}
      />

      {/* Lat/Lng hỗ trợ nhập tay (gộp một input) */}
      <Input
        placeholder="Tọa độ (vd: 16.07° N, 108.22° E)"
        value={form._lat && form._lng ? `${form._lat}, ${form._lng}` : ''}
        onChange={(e) => {
          const value = e.target.value;
          // Hỗ trợ cả định dạng "16.07,108.22" hoặc "16.07° N, 108.22° E"
          const regex = /(-?\d+(\.\d+)?)\D+(-?\d+(\.\d+)?)/;
          const match = value.match(regex);

          if (match) {
            const latStr = match[1];
            const lngStr = match[3];
            setForm((prev) => ({
              ...prev,
              _lat: latStr,
              _lng: lngStr,
            }));
          } else {
            setForm((prev) => ({ ...prev, _lat: '', _lng: '' }));
          }
        }}
      />


      {/* Vehicle type */}
      <select
        className="w-full border rounded px-3 py-2"
        value={form.vehicleType || ''}
        onChange={(e) => setField('vehicleType', e.target.value as any)}
      >
        <option value="">{t('repair_shop_form.select_vehicle_type')}</option>
        <option value="bike">{t('repair_shop_form.vehicle_bike')}</option>
        <option value="motorbike">{t('repair_shop_form.vehicle_motorbike')}</option>
        <option value="car">{t('repair_shop_form.vehicle_car')}</option>
      </select>

      {/* ⏰ Working time */}
      <div>
        <label className="font-medium block mb-2">
          {t('technician_partner_form.working_time')}
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium">
              {t('technician_partner_form.start_time')}
            </label>
            <input
              type="time"
              step="60"
              value={form.workingStartTime || ''}
              className="w-full border rounded px-2 py-1"
              onChange={(e) =>
                updateWorkingTimeField('workingStartTime', e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-xs font-medium">
              {t('technician_partner_form.end_time')}
            </label>
            <input
              type="time"
              step="60"
              value={form.workingEndTime || ''}
              className="w-full border rounded px-2 py-1"
              onChange={(e) =>
                updateWorkingTimeField('workingEndTime', e.target.value)
              }
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {t('technician_partner_form.working_time_note')}
        </p>
        {workingTimeError && (
          <p className="text-xs text-red-600 mt-1">{workingTimeError}</p>
        )}
      </div>

      <Button onClick={handleSubmit} disabled={submitting || !canSubmit}>
        {submitting
          ? t('repair_shop_form.submitting')
          : t('repair_shop_form.submit_repair_shop')}
      </Button>

      <NotificationDialog
        open={showDialog}
        type="success"
        title={t('repair_shop_form.thank_you')}
        description={t('repair_shop_form.submission_received')}
        onClose={() => setShowDialog(false)}
      />
    </div>
  );
}
