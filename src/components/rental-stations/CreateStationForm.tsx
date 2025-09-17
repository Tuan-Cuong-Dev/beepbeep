'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

import { db, auth } from '@/src/firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  GeoPoint,
} from 'firebase/firestore';
import { getIdTokenResult } from 'firebase/auth';

import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { useTranslation } from 'react-i18next';

// 👇 import đúng các type từ file bạn đưa
import type {
  RentalStationFormValues,
  StationStatus,
  VehicleType,
} from '@/src/lib/rentalStations/rentalStationTypes';

interface Props {
  companyId: string;
  onCreated?: () => void;
}

// ===== Helpers =====
function toCoordString(lat: number, lng: number) {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lng >= 0 ? 'E' : 'W';
  const absLat = Math.abs(lat).toFixed(4);
  const absLng = Math.abs(lng).toFixed(4);
  return `${absLat}° ${ns}, ${absLng}° ${ew}`;
}

function parseCommaLatLng(input: string): { lat: number; lng: number } | null {
  // hỗ trợ "16.0226,108.1207" hoặc "16.0226 , 108.1207"
  const [latStr, lngStr] = input.split(',').map((s) => s.trim());
  if (!latStr || !lngStr) return null;
  const lat = Number(latStr);
  const lng = Number(lngStr);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

export default function CreateStationForm({ companyId, onCreated }: Props) {
  const { t } = useTranslation('common');

  const [companyName, setCompanyName] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<RentalStationFormValues>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',           // sẽ tự điền "lat,lng" khi geocode xong
    contactPhone: '',
    // vehicleType & status là optional trên form (service có thể default 'active')
  });

  const [loading, setLoading] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const showDialog = (
    type: 'success' | 'error' | 'info',
    title: string,
    description = ''
  ) => setDialog({ open: true, type, title, description });

  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();

  // Khi có coords từ geocode -> đổ vào ô location dạng "lat,lng"
  useEffect(() => {
    if (coords) {
      setFormValues((prev) => ({
        ...prev,
        location: `${coords.lat},${coords.lng}`,
      }));
    }
  }, [coords]);

  // Lấy tên công ty
  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const docRef = doc(db, 'rentalCompanies', companyId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCompanyName((snap.data() as any).name || '');
        }
      } catch (err) {
        console.error('❌ Failed to load company name:', err);
      }
    };
    if (companyId) fetchCompanyName();
  }, [companyId]);

  // Lấy role từ custom claims
  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const token = await getIdTokenResult(user, true);
      const role =
        typeof token.claims.role === 'string' ? (token.claims.role as string) : 'unknown';
      setUserRole(role);
    };
    fetchRole();
  }, []);

  const handleGeocode = () => {
    if (formValues.mapAddress.trim()) geocode(formValues.mapAddress);
  };

  const handleCreate = async () => {
    const {
      name,
      displayAddress,
      mapAddress,
      location,
      contactPhone,
      vehicleType,
      status,
    } = formValues;

    if (!name.trim() || !displayAddress.trim() || !mapAddress.trim() || !location.trim()) {
      return showDialog(
        'error',
        t('station_form.error_title'),
        t('station_form.error_missing_fields')
      );
    }

    const parsed = parseCommaLatLng(location);
    if (!parsed) {
      return showDialog(
        'error',
        t('station_form.invalid_coords_title'),
        t('station_form.invalid_coords_desc')
      );
    }

    const { lat, lng } = parsed;
    const locationString = toCoordString(lat, lng); // "16.0226° N, 108.1207° E"
    const geo = new GeoPoint(lat, lng);

    setLoading(true);
    try {
      await addDoc(collection(db, 'rentalStations'), {
        companyId,
        name,
        displayAddress,
        mapAddress,
        contactPhone: contactPhone || null,
        location: locationString,      // giữ chuỗi SEO/hiển thị
        geo,                           // ✅ GeoPoint chuẩn Firestore
        vehicleType: (vehicleType as VehicleType) || null,
        status: (status as StationStatus) || 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      showDialog('success', t('station_form.success_title'), t('station_form.success_desc'));
      setFormValues({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        contactPhone: '',
      });
      onCreated?.();
    } catch (err) {
      console.error('❌ Error creating station:', err);
      showDialog(
        'error',
        t('station_form.create_failed_title'),
        t('station_form.create_failed_desc')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        {(companyName || userRole) && (
          <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 text-sm text-gray-800 space-y-1">
            {companyName && (
              <p>
                🏢 <span className="font-semibold">{t('station_form.company')}:</span>{' '}
                {companyName}
              </p>
            )}
            {userRole && (
              <p>
                🛂 <span className="font-semibold">{t('station_form.role')}:</span>{' '}
                {/* dịch role: company_owner -> Chủ công ty, v.v. */}
                {t(`roles.${userRole || 'unknown'}`)}
              </p>
            )}
          </div>
        )}

        <Input
          placeholder={t('station_form.station_name')}
          value={formValues.name}
          onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
        />

        <Textarea
          placeholder={t('station_form.display_address')}
          value={formValues.displayAddress}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, displayAddress: e.target.value }))
          }
        />

        <Textarea
          placeholder={t('station_form.map_address')}
          value={formValues.mapAddress}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, mapAddress: e.target.value }))
          }
          onBlur={handleGeocode}
        />

        <Input
          placeholder={t('station_form.contact_phone')}
          value={formValues.contactPhone}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, contactPhone: e.target.value }))
          }
        />

        {/* Ô tọa độ: có thể auto-fill từ geocode hoặc nhập tay "lat,lng" */}
        <Input
          placeholder={t('station_form.coordinates')}
          value={formValues.location}
          readOnly={!!coords} // nếu đã detect thì khoá để tránh sai lệch
          onChange={(e) => setFormValues((prev) => ({ ...prev, location: e.target.value }))}
        />

        {geoLoading && (
          <p className="text-sm text-gray-500">{t('station_form.detecting_coords')}</p>
        )}
        {geoError && <p className="text-sm text-red-500">{geoError}</p>}

        {coords && (
          <>
            <p className="text-sm text-gray-600">
              📌{' '}
              {t('station_form.detected_coords', {
                lat: coords.lat.toString(),
                lng: coords.lng.toString(),
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
              src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=en&z=16&output=embed`}
            />
          </>
        )}

        <Button onClick={handleCreate} disabled={loading}>
          {loading ? t('station_form.creating') : t('station_form.create_button')}
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
