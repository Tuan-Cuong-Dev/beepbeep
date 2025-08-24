'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, GeoPoint } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';
import { useTechnicianPartners } from '@/src/hooks/useTechnicianPartners';
import { TechnicianPartner, VehicleType } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import dynamic from 'next/dynamic';
import { useTranslation } from 'react-i18next';

const MapPreview = dynamic(() => import('@/src/components/map/MapPreview'), { ssr: false });

// ===== Helpers =====
type LatLng = { lat: number; lng: number };

function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

function extractLatLngFromLocation(loc?: Pick<LocationCore, 'geo' | 'location'> | null): LatLng | null {
  if (!loc) return null;
  if (loc.geo && typeof loc.geo.latitude === 'number' && typeof loc.geo.longitude === 'number') {
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }
  return parseLatLngString(loc.location) ?? null;
}

// FormState cho phép location là Partial<LocationCore> trong lúc nhập
type FormState = Partial<Omit<TechnicianPartner, 'location'>> & {
  location?: Partial<LocationCore>;
  _lat?: string;
  _lng?: string;
};

interface Props {
  id: string;
  onClose: () => void;
}

export default function TechnicianPartnerEditForm({ id, onClose }: Props) {
  const { t } = useTranslation('common');
  const { updatePartner } = useTechnicianPartners();
  const { coords, geocode } = useGeocodeAddress();

  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);

  // Load doc
  useEffect(() => {
    (async () => {
      const ref = doc(db, 'technicianPartners', id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as TechnicianPartner;
        const latlng = extractLatLngFromLocation(data.location);
        setForm({
          ...data,
          location: { ...data.location }, // giữ nguyên location cũ
          _lat: latlng ? String(latlng.lat) : '',
          _lng: latlng ? String(latlng.lng) : '',
        });
      } else {
        setForm({
          type: 'shop',
          name: '',
          phone: '',
          // shopName vẫn hợp lệ (Shop fields)
          shopName: '',
          // KHÔNG dùng shopAddress ở root nữa
          location: { address: '', location: '' },
          assignedRegions: [],
          vehicleType: 'motorbike',
          isActive: false,
          _lat: '',
          _lng: '',
        });
      }
    })();
  }, [id]);

  // Geocode khi đổi địa chỉ bản đồ (location.address)
  useEffect(() => {
    const addr = form?.location?.address;
    if (typeof addr === 'string' && addr.trim()) {
      geocode(addr.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form?.location?.address]);

  // Khi có coords từ geocode → cập nhật preview lat/lng & location.location
  useEffect(() => {
    if (!form || !coords) return;
    setForm((prev) =>
      prev
        ? {
            ...prev,
            _lat: String(coords.lat ?? ''),
            _lng: String(coords.lng ?? ''),
            location: {
              ...(prev.location || {}),
              location: `${coords.lat},${coords.lng}`,
            },
          }
        : prev
    );
  }, [coords, form]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const setLocationField = (key: 'address' | 'location', value: string) => {
    setForm((prev) =>
      prev
        ? {
            ...prev,
            location: {
              ...(prev.location || {}),
              [key]: value,
            },
          }
        : prev
    );
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      // Quy tắc chốt lat/lng:
      // 1) Ưu tiên _lat/_lng (user nhập tay hoặc từ geocode)
      // 2) Nếu không có, thử parse từ location.location
      // 3) Nếu vẫn không có nhưng location cũ đã có geo → giữ nguyên geo
      // 4) Nếu không có gì → không gửi field 'location' trong update (tránh vi phạm schema)

      let latLngFromInputs: LatLng | null = null;

      const typedLat = form._lat ? parseFloat(form._lat) : NaN;
      const typedLng = form._lng ? parseFloat(form._lng) : NaN;
      if (Number.isFinite(typedLat) && Number.isFinite(typedLng)) {
        latLngFromInputs = { lat: typedLat, lng: typedLng };
      } else {
        latLngFromInputs = parseLatLngString(form.location?.location);
      }

      // Chuẩn hóa vehicleType
      const vt: VehicleType | undefined =
        form.vehicleType === 'bike' || form.vehicleType === 'motorbike' || form.vehicleType === 'car'
          ? form.vehicleType
          : undefined;

      // Build payload
      const updateData: Partial<TechnicianPartner> = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        shopName: form.shopName,
        type: 'shop',
        vehicleType: vt,
        workingStartTime: form.workingStartTime,
        workingEndTime: form.workingEndTime,
        assignedRegions: form.assignedRegions,
        serviceCategories: form.serviceCategories,
        role: 'technician_partner',
      };

      // Xử lý location
      if (latLngFromInputs) {
        const { lat, lng } = latLngFromInputs;
        updateData.location = {
          geo: new GeoPoint(lat, lng),
          location: `${lat},${lng}`,
          address: form.location?.address || '',
          // mapAddress nếu bạn muốn lưu ở location (không phải root):
          // mapAddress: form.location?.mapAddress,
        } as LocationCore;
      } else if (form.location?.geo) {
        // Giữ nguyên geo cũ, chỉ có thể update address/location string nếu có
        updateData.location = {
          ...(form.location as LocationCore),
        };
      } // else: không có gì chắc chắn → bỏ qua field 'location'

      await updatePartner(id, updateData);
      onClose();
    } catch (err) {
      console.error(err);
      alert(t('repair_shop_edit_form.update_error') || 'Failed to update repair shop.');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <p className="p-4 text-center">{t('loading') || 'Loading...'}</p>;

  // Tính coords để preview map
  const previewLatLng = (() => {
    if (form._lat && form._lng && Number.isFinite(parseFloat(form._lat)) && Number.isFinite(parseFloat(form._lng))) {
      return { lat: parseFloat(form._lat), lng: parseFloat(form._lng) };
    }
    return extractLatLngFromLocation(form.location as LocationCore | undefined);
  })();

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      <div>
        <Label>{t('repair_shop_edit_form.technician_name')}</Label>
        <Input value={form.name || ''} onChange={(e) => setField('name', e.target.value)} />
      </div>

      <div>
        <Label>{t('repair_shop_edit_form.phone_number')}</Label>
        <Input value={form.phone || ''} onChange={(e) => setField('phone', e.target.value)} />
      </div>

      <div>
        <Label>Email</Label>
        <Input value={form.email || ''} onChange={(e) => setField('email', e.target.value)} />
      </div>

      <div>
        <Label>{t('repair_shop_edit_form.shop_name_optional')}</Label>
        <Input value={form.shopName || ''} onChange={(e) => setField('shopName', e.target.value)} />
      </div>

      {/* Địa chỉ cửa hàng → lưu trong location.address */}
      <div>
        <Label>{t('repair_shop_edit_form.shop_address')}</Label>
        <Textarea value={form.location?.address || ''} onChange={(e) => setLocationField('address', e.target.value)} />
      </div>

      {/* Lat/Lng trợ giúp nhập tay */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>{t('repair_shop_edit_form.latitude')}</Label>
          <Input value={form._lat ?? ''} onChange={(e) => setForm((p) => (p ? { ...p, _lat: e.target.value } : p))} />
        </div>
        <div>
          <Label>{t('repair_shop_edit_form.longitude')}</Label>
          <Input value={form._lng ?? ''} onChange={(e) => setForm((p) => (p ? { ...p, _lng: e.target.value } : p))} />
        </div>
      </div>

      {previewLatLng && (
        <div className="h-48 rounded overflow-hidden border mt-2">
          <MapPreview coords={previewLatLng} />
        </div>
      )}

      <div>
        <Label>{t('repair_shop_edit_form.select_vehicle_type')}</Label>
        <select
          className="w-full border rounded px-3 py-2"
          value={form.vehicleType || ''}
          onChange={(e) => setField('vehicleType', e.target.value as VehicleType)}
        >
          <option value="">{t('repair_shop_edit_form.select_vehicle_type')}</option>
          <option value="bike">{t('repair_shop_edit_form.vehicle_bike')}</option>
          <option value="motorbike">{t('repair_shop_edit_form.vehicle_motorbike')}</option>
          <option value="car">{t('repair_shop_edit_form.vehicle_car')}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{t('repair_shop_edit_form.working_start_time')}</Label>
          <Input
            placeholder="08:00"
            value={form.workingStartTime || ''}
            onChange={(e) => setField('workingStartTime', e.target.value)}
          />
        </div>
        <div>
          <Label>{t('repair_shop_edit_form.working_end_time')}</Label>
          <Input
            placeholder="18:00"
            value={form.workingEndTime || ''}
            onChange={(e) => setField('workingEndTime', e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="ghost" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t('common.saving') : t('common.save')}
        </Button>
      </div>
    </div>
  );
}
