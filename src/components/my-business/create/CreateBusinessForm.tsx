'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { db, auth } from '@/src/firebaseConfig';
import {
  collection,
  doc,
  GeoPoint,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import type { BusinessType } from '@/src/lib/my-business/businessTypes';
import { useTranslation } from 'react-i18next';

interface Props {
  BusinessType: BusinessType;
}

const BusinessTypeConfig: Record<
  BusinessType,
  { collection: string; role: string; redirect: string; additionalData?: Record<string, any> }
> = {
  rental_company:     { collection: 'rentalCompanies',       role: 'company_owner',     redirect: '/profile?tab=business' },
  private_provider:   { collection: 'privateProviders',      role: 'private_provider',  redirect: '/profile?tab=business' },
  agent:              { collection: 'agents',                role: 'agent',             redirect: '/profile?tab=business' },
  technician_partner: { collection: 'technicianPartners',    role: 'technician_partner',redirect: '/profile?tab=business' },
  intercity_bus:      { collection: 'intercityBusCompanies', role: 'intercity_bus',     redirect: '/profile?tab=business' },
  vehicle_transport:  { collection: 'vehicleTransporters',   role: 'vehicle_transport', redirect: '/profile?tab=business' },
  tour_guide:         { collection: 'tourGuides',            role: 'tour_guide',        redirect: '/profile?tab=business' },
};

// Helpers
type Coords = { lat: number; lng: number };
function parseLatLng(s?: string): Coords | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]); const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export default function CreateBusinessForm({ BusinessType }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams(); // có thể null theo typing ⇒ luôn dùng ?.get
  const subtypeParam = (searchParams?.get('subtype') || '').toLowerCase();
  const technicianSubtype = useMemo<'mobile' | 'shop' | undefined>(() => {
    if (BusinessType !== 'technician_partner') return undefined;
    return subtypeParam === 'mobile' || subtypeParam === 'shop' ? subtypeParam : 'mobile';
  }, [BusinessType, subtypeParam]);

  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    displayAddress: '',
    mapAddress: '',
    location: '', // "lat,lng" – chỉ để UX; server sẽ build LocationCore
  });

  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  // Prefill từ current user
  useEffect(() => {
    const u = auth.currentUser;
    if (u?.email) setForm((p) => ({ ...p, email: u.email! }));
    if (u?.phoneNumber) setForm((p) => ({ ...p, phone: p.phone || u.phoneNumber! }));
  }, []);

  // Khi geocode xong → ghi vào input location
  useEffect(() => {
    if (coords) setForm((prev) => ({ ...prev, location: `${coords.lat},${coords.lng}` }));
  }, [coords]);

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') =>
    setDialog({ open: true, type, title, description });

  const handleChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleBlur = () => {
    // Cho phép user nhập mapAddress rồi geocode để lấy tọa độ
    if (form.mapAddress.trim()) geocode(form.mapAddress.trim());
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      return showDialog(
        'error',
        t('create_business_form.not_logged_in_title'),
        t('create_business_form.not_logged_in_description')
      );
    }

    const { name, email, phone, displayAddress, mapAddress, location } = form;
    if (!name || !phone || !displayAddress || !mapAddress || !location) {
      return showDialog(
        'error',
        t('create_business_form.missing_fields_title'),
        t('create_business_form.missing_fields_description')
      );
    }

    // Ưu tiên toạ độ từ hook geocode; fallback parse từ input
    const c = coords ?? parseLatLng(location);
    if (!c) {
      return showDialog(
        'error',
        t('create_business_form.error_title'),
        t('create_business_form.invalid_coordinates')
      );
    }

    const cfg = BusinessTypeConfig[BusinessType];
    setLoading(true);

    try {
      // LocationCore đúng chuẩn
      const locationCore = {
        geo: new GeoPoint(c.lat, c.lng),
        location: `${c.lat},${c.lng}`,
        mapAddress: mapAddress || undefined,
        address: displayAddress || undefined,
        updatedAt: serverTimestamp(),
      };

      // Meta user thời điểm tạo
      const userMeta = {
        uid: user.uid,
        email: user.email || null,
        displayName: user.displayName || null,
        photoURL: user.photoURL || null,
        phoneNumber: user.phoneNumber || null,
        emailVerified: !!user.emailVerified,
      };

      const batch = writeBatch(db);
      const docRef = doc(collection(db, cfg.collection)); // tạo sẵn id

      // Tài liệu business (mặc định chung)
      const baseDoc = {
        id: docRef.id,
        name,
        email,
        phone,
        displayAddress,
        mapAddress,
        location: locationCore,              // ✅ LocationCore
        businessType: BusinessType,
        ownerId: user.uid,
        owners: [user.uid],
        members: [user.uid],
        ownerMeta: userMeta,                 // ✅ đính kèm thông tin user tạo
        status: 'active' as const,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(cfg.additionalData || {}),
      } as Record<string, any>;

      // Nếu là technician_partner, thêm trường phân loại
      if (BusinessType === 'technician_partner') {
        // Ghi cả hai để tương thích: subtype (mới) + type (shop/mobile) dùng chung với schema technicianPartner
        baseDoc.subtype = technicianSubtype ?? 'mobile';
        baseDoc.type = technicianSubtype ?? 'mobile';
        // Một số client cũ có thể đọc vehicleType mặc định
        baseDoc.vehicleType = baseDoc.vehicleType || 'motorbike';
        // Đảm bảo có cờ hoạt động ban đầu
        baseDoc.isActive = baseDoc.isActive ?? true;
      }

      // Ghi business
      batch.set(docRef, baseDoc);

      // Cập nhật user role & business ref
      const userRef = doc(db, 'users', user.uid);
      batch.set(
        userRef,
        {
          role: cfg.role,
          business: {
            id: docRef.id,
            type: BusinessType,
            collection: cfg.collection,
            // để client khác biết dạng technician
            ...(BusinessType === 'technician_partner' && technicianSubtype
              ? { subtype: technicianSubtype }
              : {}),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      // Với vài role cần custom claims (ví dụ rental_company). Giữ nguyên hành vi cũ nếu bạn muốn.
      if (BusinessType === 'rental_company') {
        await fetch('/api/setCustomClaims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, role: cfg.role }),
        });
        await new Promise((r) => setTimeout(r, 1000));
        await auth.currentUser?.getIdToken(true);
      }

      showDialog(
        'success',
        t('create_business_form.success_title'),
        t('create_business_form.success_description')
      );
      setTimeout(() => router.push(cfg.redirect), 1000);
    } catch (err) {
      console.error('❌ Error creating business:', err);
      showDialog(
        'error',
        t('create_business_form.error_title'),
        t('create_business_form.error_description')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Input
          placeholder={t('create_business_form.name_placeholder')}
          value={form.name}
          onChange={handleChange('name')}
        />
        <Input
          placeholder={t('create_business_form.email_placeholder')}
          value={form.email}
          readOnly
          className="bg-gray-100 cursor-not-allowed"
        />
        <Input
          placeholder={t('create_business_form.phone_placeholder')}
          value={form.phone}
          onChange={handleChange('phone')}
        />
        <Input
          placeholder={t('create_business_form.display_address_placeholder')}
          value={form.displayAddress}
          onChange={handleChange('displayAddress')}
        />
        <Input
          placeholder={t('create_business_form.map_address_placeholder')}
          value={form.mapAddress}
          onChange={handleChange('mapAddress')}
          onBlur={handleBlur}
        />
        <Input
          placeholder={t('create_business_form.location_placeholder')}
          value={form.location}
          readOnly={!!coords}
          onChange={handleChange('location')}
        />

        {/* Gợi ý subtype khi là technician_partner */}
        {BusinessType === 'technician_partner' && (
          <p className="text-xs text-gray-600">
            {t('create_business_form.technician_subtype_hint', {
              // render label đã dịch thay vì giá trị thô
              subtype: t(`create_business_form.subtype.${technicianSubtype ?? 'mobile'}`)
            })}
          </p>
        )}

        {geoLoading && (
          <p className="text-sm text-gray-500">
            {t('create_business_form.detecting_coordinates')}
          </p>
        )}
        {geoError && <p className="text-sm text-red-500">{geoError}</p>}

        {coords && (
          <>
            <p className="text-sm text-gray-600">
              {t('create_business_form.detected_coordinates')} {coords.lat}, {coords.lng}
            </p>
            <iframe
              title="Map Preview"
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: '8px' }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=16&output=embed`}
            />
          </>
        )}

        <Button onClick={handleSubmit} disabled={loading}>
          {loading
            ? t('create_business_form.creating_button')
            : t('create_business_form.create_button')}
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
