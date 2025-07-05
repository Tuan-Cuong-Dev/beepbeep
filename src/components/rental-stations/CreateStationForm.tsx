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

interface Props {
  companyId: string;
  onCreated?: () => void;
}

export default function CreateStationForm({ companyId, onCreated }: Props) {
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
      return showDialog('error', 'Missing Data', 'Please fill in all required fields.');
    }

    const [latStr, lngStr] = location.split(',').map((s) => s.trim());
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);

    if (isNaN(lat) || isNaN(lng)) {
      return showDialog('error', 'Invalid Coordinates', 'Use format: "16.0514,108.2123"');
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

      showDialog('success', 'Station Created', '✅ The station was added successfully.');
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
      showDialog('error', 'Failed to Create', '❌ Please try again.');
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
                🏢 <span className="font-semibold">Company:</span> {companyName}
              </p>
            )}
            {userRole && (
              <p>
                🛂 <span className="font-semibold">Role:</span> {userRole}
              </p>
            )}
          </div>
        )}

        <Input
          placeholder="Station Name"
          value={formValues.name}
          onChange={(e) => setFormValues((prev) => ({ ...prev, name: e.target.value }))}
        />

        <Textarea
          placeholder="Display Address (shown to users)"
          value={formValues.displayAddress}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, displayAddress: e.target.value }))
          }
        />

        <Textarea
          placeholder="Map Address (Google Maps link with coordinates)"
          value={formValues.mapAddress}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, mapAddress: e.target.value }))
          }
          onBlur={handleGeocode}
        />

        <Input
          placeholder="Contact Phone (e.g. 090-xxx-xxxx)"
          value={formValues.contactPhone}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, contactPhone: e.target.value }))
          }
        />

        <Input
          placeholder="Coordinates (lat,lng)"
          value={formValues.location}
          readOnly={!!coords}
          onChange={(e) =>
            setFormValues((prev) => ({ ...prev, location: e.target.value }))
          }
        />

        {geoLoading && <p className="text-sm text-gray-500">📍 Detecting coordinates...</p>}
        {geoError && <p className="text-sm text-red-500">{geoError}</p>}

        {coords && (
          <>
            <p className="text-sm text-gray-600">
              📌 Detected: {coords.lat}° N, {coords.lng}° E
            </p>
            <iframe
              title="Map Preview"
              width="100%"
              height="200"
              className="rounded-xl"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=16&output=embed`}
            ></iframe>
          </>
        )}

        <Button onClick={handleCreate} disabled={loading}>
          {loading ? 'Creating...' : 'Create Station'}
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
