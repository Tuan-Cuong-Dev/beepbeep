'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, Timestamp, GeoPoint } from 'firebase/firestore';
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
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function extractLatLngFromLocation(loc?: LocationCore | null): LatLng | null {
  if (!loc) return null;
  // GeoPoint
  if (typeof loc.geo?.latitude === 'number' && typeof loc.geo?.longitude === 'number') {
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }
  const parsed = parseLatLngString(loc.location);
  return parsed ?? null;
}

interface Props {
  id: string;
  onClose: () => void;
}

export default function RepairShopEditForm({ id, onClose }: Props) {
  const { t } = useTranslation('common');
  const { updatePartner } = useTechnicianPartners();
  const { coords, geocode } = useGeocodeAddress();

  // Giữ form theo chuẩn mới + hai input phụ trợ lat/lng
  const [form, setForm] = useState<(Partial<TechnicianPartner> & { _lat?: string; _lng?: string }) | null>(null);
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
          _lat: latlng ? String(latlng.lat) : '',
          _lng: latlng ? String(latlng.lng) : '',
        });
      } else {
        setForm({
          type: 'shop',
          name: '',
          phone: '',
          shopName: '',
          shopAddress: '',
          location: { address: '', location: '' } as Partial<LocationCore> as LocationCore,
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
    const addr = (form?.location as any)?.address;
    if (typeof addr === 'string' && addr.trim()) {
      geocode(addr.trim());
    }
  }, [form?.location, geocode]);

  // Khi có coords từ geocode → cập nhật preview lat/lng & location.location
  useEffect(() => {
    if (!form) return;
    if (coords) {
      setForm((prev) =>
        prev
          ? {
              ...prev,
              _lat: String(coords.lat ?? ''),
              _lng: String(coords.lng ?? ''),
              location: {
                ...(prev.location || {}),
                location: `${coords.lat},${coords.lng}`,
              } as Partial<LocationCore> as LocationCore,
            }
          : prev
      );
    }
  }, [coords, form]);

  const setField = (field: keyof TechnicianPartner, value: any) => {
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
            } as Partial<LocationCore> as LocationCore,
          }
        : prev
    );
  };

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    try {
      // Chốt lat/lng theo ưu tiên: _lat/_lng → location.location → giữ nguyên
      let lat: number | undefined;
      let lng: number | undefined;

      const typedLat = form._lat ? parseFloat(form._lat) : NaN;
      const typedLng = form._lng ? parseFloat(form._lng) : NaN;

      if (Number.isFinite(typedLat) && Number.isFinite(typedLng)) {
        lat = typedLat;
        lng = typedLng;
      } else {
        const parsed = parseLatLngString((form.location as any)?.location);
        if (parsed) {
          lat = parsed.lat;
          lng = parsed.lng;
        }
      }

      // Build location (nếu có lat/lng)
      let nextLocation: LocationCore | undefined = undefined;
      if (lat !== undefined && lng !== undefined) {
        nextLocation = {
          geo: new GeoPoint(lat, lng),
          location: `${lat},${lng}`,
          address: (form.location as any)?.address || form.shopAddress || '',
          // Dùng Timestamp.now() để khớp type nếu updatedAt của LocationCore là Timestamp
          updatedAt: Timestamp.now(),
        } as unknown as LocationCore;
      } else if (form.location) {
        // Không có lat/lng mới → giữ nguyên location (nhưng vẫn có thể update address)
        nextLocation = {
          ...(form.location as any),
          address: (form.location as any)?.address || form.shopAddress || '',
          updatedAt: Timestamp.now(),
        } as unknown as LocationCore;
      }

      // Chuẩn hóa vehicleType đúng enum
      const vt: VehicleType | undefined =
        form.vehicleType === 'bike' || form.vehicleType === 'motorbike' || form.vehicleType === 'car'
          ? form.vehicleType
          : undefined;

      const updateData: Partial<TechnicianPartner> = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        shopName: form.shopName,
        shopAddress: form.shopAddress,
        type: 'shop',
        vehicleType: vt,
        location: nextLocation,
        // Có thể cập nhật cả workingStartTime/workingEndTime nếu form có
        workingStartTime: form.workingStartTime,
        workingEndTime: form.workingEndTime,
        assignedRegions: form.assignedRegions,
        serviceCategories: form.serviceCategories,
        // Audit doc-level
        updatedAt: Timestamp.now(),
      };

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
    const typed =
      form._lat && form._lng && Number.isFinite(parseFloat(form._lat)) && Number.isFinite(parseFloat(form._lng))
        ? { lat: parseFloat(form._lat), lng: parseFloat(form._lng) }
        : null;
    return typed || extractLatLngFromLocation(form.location);
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

      <div>
        <Label>{t('repair_shop_edit_form.shop_address')}</Label>
        <Textarea value={form.shopAddress || ''} onChange={(e) => setField('shopAddress', e.target.value)} />
      </div>

      {/* Địa chỉ bản đồ → lưu vào location.address */}
      <div>
        <Label>{t('repair_shop_edit_form.map_address')}</Label>
        <Textarea
          className="min-h-[120px]"
          value={(form.location as any)?.address || ''}
          onChange={(e) => setLocationField('address', e.target.value)}
        />
      </div>

      {/* Lat/Lng trợ giúp nhập tay */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>{t('repair_shop_edit_form.latitude')}</Label>
          <Input
            value={form._lat ?? ''}
            onChange={(e) => setForm((p) => (p ? { ...p, _lat: e.target.value } : p))}
          />
        </div>
        <div>
          <Label>{t('repair_shop_edit_form.longitude')}</Label>
          <Input
            value={form._lng ?? ''}
            onChange={(e) => setForm((p) => (p ? { ...p, _lng: e.target.value } : p))}
          />
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
