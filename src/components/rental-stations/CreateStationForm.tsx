'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { db, auth } from '@/src/firebaseConfig';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getIdTokenResult } from 'firebase/auth';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { StationFormValues } from '@/src/lib/stations/stationTypes';
import { useTranslation } from 'react-i18next';

interface Props {
  companyId: string;
  onCreated?: () => void;
}

export default function CreateStationForm({ companyId, onCreated }: Props) {
  const { t } = useTranslation('common');
  const [companyName, setCompanyName] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<StationFormValues>({
    name: '',
    displayAddress: '',
    mapAddress: '',
    location: '',
    contactPhone: '',
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
  ) => {
    setDialog({ open: true, type, title, description });
  };

  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();

  useEffect(() => {
    if (coords) {
      setFormValues((prev) => ({
        ...prev,
        location: `${coords.lat},${coords.lng}`,
      }));
    }
  }, [coords]);

  useEffect(() => {
    const fetchCompanyName = async () => {
      try {
        const docRef = doc(db, 'rentalCompanies', companyId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setCompanyName(snap.data().name || '');
        }
      } catch (err) {
        console.error('❌ Failed to load company name:', err);
      }
    };

    if (companyId) fetchCompanyName();
  }, [companyId]);

  useEffect(() => {
    const fetchRole = async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await getIdTokenResult(user, true);
        setUserRole(typeof token.claims.role === 'string' ? token.claims.role : 'unknown');
      }
    };
    fetchRole();
  }, []);

  const handleGeocode = () => {
    if (formValues.mapAddress.trim()) geocode(formValues.mapAddress);
  };

  const handleCreate = async () => {
    const { name, displayAddress, mapAddress, location, contactPhone } = formValues;

    if (!name.trim() || !displayAddress.trim() || !mapAddress.trim() || !location.trim()) {
      return showDialog('error', t('station_form.error_title'), t('station_form.error_missing_fields'));
    }

    const [latStr, lngStr] = location.split(',').map((s) => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return showDialog('error', t('station_form.invalid_coords_title'), t('station_form.invalid_coords_desc'));
    }

    const formattedLocation = `${lat}° N, ${lng}° E`;
    setLoading(true);

    try {
      await addDoc(collection(db, 'rentalStations'), {
        companyId,
        name,
        displayAddress,
        mapAddress,
        contactPhone,
        location: formattedLocation,
        geo: { lat, lng },
        status: 'active',
        createdAt: serverTimestamp(),
      });

      showDialog('success', t('station_form.success_title'), t('station_form.success_desc'));
      setFormValues({
        name: '',
        displayAddress: '',
        mapAddress: '',
        location: '',
        contactPhone: '',
      });
      if (onCreated) onCreated();
    } catch (err) {
      console.error('❌ Error creating station:', err);
      showDialog('error', t('station_form.create_failed_title'), t('station_form.create_failed_desc'));
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
                🏢 <span className="font-semibold">{t('station_form.company')}:</span> {companyName}
              </p>
            )}
            {userRole && (
              <p>
                🛂 <span className="font-semibold">{t('station_form.role')}:</span> {userRole}
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

        <Input
          placeholder={t('station_form.coordinates')}
          value={formValues.location}
          readOnly={!!coords}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, location: e.target.value }))
          }
        />

        {geoLoading && <p className="text-sm text-gray-500">{t('station_form.detecting_coords')}</p>}
        {geoError && <p className="text-sm text-red-500">{geoError}</p>}

        {coords && (
          <>
            <p className="text-sm text-gray-600">
              📌 {t('station_form.detected_coords', { lat: coords.lat.toString(), lng: coords.lng.toString() })}
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
            ></iframe>
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
