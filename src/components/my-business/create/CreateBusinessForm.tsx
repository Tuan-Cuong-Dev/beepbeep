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
import { BUSINESS_ROUTE_CONFIG } from '@/src/lib/my-business/routeConfig';
import { useTranslation } from 'react-i18next';

interface Props {
  businessType: BusinessType; // ✅ rename prop
}

type Coords = { lat: number; lng: number };

const BusinessTypeConfig = BUSINESS_ROUTE_CONFIG; // dùng chung

// Helpers
function parseLatLng(s?: string): Coords | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]); const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

export default function CreateBusinessForm({ businessType }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  // subtype chỉ áp dụng cho technician_partner
  const subtypeParam = (searchParams?.get('subtype') || '').toLowerCase();
  const technicianSubtype = useMemo<'mobile' | 'shop' | undefined>(() => {
    if (businessType !== 'technician_partner') return undefined;
    return subtypeParam === 'mobile' || subtypeParam === 'shop' ? subtypeParam : 'mobile';
  }, [businessType, subtypeParam]);

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

    const { name, phone, displayAddress, mapAddress, location } = form;
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

    const cfg = BusinessTypeConfig[businessType];
    setLoading(true);

    try {
      // LocationCore
      const locationCore = {
        geo: new GeoPoint(c.lat, c.lng),
        location: `${c.lat},${c.lng}`,
        mapAddress: form.mapAddress || undefined,
        address: form.displayAddress || undefined,
        updatedAt: serverTimestamp(),
      };

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

      const baseDoc: Record<string, any> = {
        id: docRef.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        displayAddress: form.displayAddress,
        mapAddress: form.mapAddress,
        location: locationCore,
        businessType: businessType,
        ownerId: user.uid,
        owners: [user.uid],
        members: [user.uid],
        ownerMeta: userMeta,
        status: 'active' as const,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        ...(cfg.additionalData || {}),
      };

      if (businessType === 'technician_partner') {
        baseDoc.subtype = technicianSubtype ?? 'mobile';
        baseDoc.type = technicianSubtype ?? 'mobile';
        baseDoc.vehicleType = baseDoc.vehicleType || 'motorbike';
        baseDoc.isActive = baseDoc.isActive ?? true;
      }

      batch.set(docRef, baseDoc);

      // Update user profile with role & business ref
      const userRef = doc(db, 'users', user.uid);
      batch.set(
        userRef,
        {
          role: cfg.role,
          business: {
            id: docRef.id,
            type: businessType,
            collection: cfg.collection,
            ...(businessType === 'technician_partner' && technicianSubtype
              ? { subtype: technicianSubtype }
              : {}),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();

      // Custom claims cho rental_company (nếu dùng)
      if (businessType === 'rental_company') {
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

        {businessType === 'technician_partner' && (
          <p className="text-xs text-gray-600">
            {t('create_business_form.technician_subtype_hint', {
              subtype: t(`create_business_form.subtype.${technicianSubtype ?? 'mobile'}`),
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
