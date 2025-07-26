// ✅ Refactored CreateBusinessForm.tsx with full businessType + collection mapping

'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { db, auth } from '@/src/firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useGeocodeAddress } from '@/src/hooks/useGeocodeAddress';
import { BusinessType } from '@/src/lib/my-business/businessTypes';
import { useRouter } from 'next/navigation';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

interface Props {
  businessType: BusinessType;
}

// 🔁 Central mapping
const businessTypeConfig: Record<BusinessType, {
  collection: string;
  role: string;
  redirect: string;
}> = {
  rental_company: {
    collection: 'rentalCompanies',
    role: 'company_owner',
    redirect: '/my-business/stations',
  },
  private_provider: {
    collection: 'privateProviders',
    role: 'private_owner',
    redirect: '/my-business',
  },
  agent: {
    collection: 'agents',
    role: 'agent',
    redirect: '/my-business',
  },
  technician_mobile: {
    collection: 'technicianPartners',
    role: 'technician_partner',
    redirect: '/technician-partners',
  },
  technician_shop: {
    collection: 'technicianPartners',
    role: 'technician_partner',
    redirect: '/technician-partners',
  },
  intercity_bus: {
    collection: 'intercityBusCompanies',
    role: 'intercity_bus',
    redirect: '/my-business',
  },
  vehicle_transport: {
    collection: 'vehicleTransporters',
    role: 'vehicle_transport',
    redirect: '/my-business',
  },
  tour_guide: {
    collection: 'tourGuides',
    role: 'tour_guide',
    redirect: '/my-business',
  },
};

export default function CreateBusinessForm({ businessType }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [displayAddress, setDisplayAddress] = useState('');
  const [mapAddress, setMapAddress] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  const [dialog, setDialog] = useState({
    open: false,
    type: 'info' as 'success' | 'error' | 'info',
    title: '',
    description: '',
  });

  const showDialog = (type: 'success' | 'error' | 'info', title: string, description = '') => {
    setDialog({ open: true, type, title, description });
  };

  const { geocode, coords, error: geoError, loading: geoLoading } = useGeocodeAddress();
  const router = useRouter();

  useEffect(() => {
    if (coords) {
      setLocation(`${coords.lat},${coords.lng}`);
    }
  }, [coords]);

  const handleBlur = () => {
    if (mapAddress.trim()) geocode(mapAddress);
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) return showDialog('error', 'Not Logged In', 'You must be logged in.');

    if (!name || !phone || !displayAddress || !mapAddress || !location) {
      return showDialog('error', 'Missing Fields', 'Please fill in all fields.');
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
      const config = businessTypeConfig[businessType];
      const data = {
        name,
        email,
        phone,
        displayAddress,
        mapAddress,
        location: formattedLocation,
        ownerId: user.uid,
        businessType,
        createdAt: serverTimestamp(),
      };

      if (businessType === 'technician_mobile') {
        (data as any).type = 'mobile';
      }
      if (businessType === 'technician_shop') {
        (data as any).type = 'shop';
      }

      const docRef = await addDoc(collection(db, config.collection), data);

      await updateDoc(doc(db, 'users', user.uid), {
        role: config.role,
        companyId: docRef.id,
        updatedAt: serverTimestamp(),
      });

      if (businessType === 'rental_company') {
        await fetch('/api/setCustomClaims', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid: user.uid, role: config.role }),
        });

        await new Promise((resolve) => setTimeout(resolve, 1500));
        await auth.currentUser?.getIdToken(true);
      }

      showDialog('success', 'Company Created', '✅ Your company was added successfully.');
      setTimeout(() => {
        router.push(config.redirect);
      }, 1000);
    } catch (err) {
      console.error('❌ Error:', err);
      showDialog('error', 'Failed to Create Company', '❌ Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="space-y-4">
        <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Input placeholder="Display Address" value={displayAddress} onChange={(e) => setDisplayAddress(e.target.value)} />
        <Input placeholder="Map Address (Google Maps link)" value={mapAddress} onChange={(e) => setMapAddress(e.target.value)} onBlur={handleBlur} />
        <Input placeholder="Location (lat,lng)" value={location} readOnly={!!coords} onChange={(e) => setLocation(e.target.value)} />

        {geoLoading && <p className="text-sm text-gray-500">📍 Detecting coordinates...</p>}
        {geoError && <p className="text-sm text-red-500">{geoError}</p>}
        {coords && (
          <>
            <p className="text-sm text-gray-600">📌 Detected: {coords.lat}° N, {coords.lng}° E</p>
            <iframe
              title="Map Preview"
              width="100%"
              height="200"
              style={{ border: 0, borderRadius: '8px' }}
              loading="lazy"
              allowFullScreen
              src={`https://www.google.com/maps?q=${coords.lat},${coords.lng}&hl=vi&z=16&output=embed`}
            ></iframe>
          </>
        )}

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
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
