'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike'; // vẫn giữ để phòng dùng sau
}

export default function TechnicianMarkers({ vehicleType }: Props) {
  const [technicians, setTechnicians] = useState<TechnicianPartner[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'technicianPartners'), where('isActive', '==', true));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => {
        const raw = doc.data();

        const coordinates = {
          lat: raw.coordinates?.latitude ?? raw.coordinates?.lat ?? 0,
          lng: raw.coordinates?.longitude ?? raw.coordinates?.lng ?? 0,
        };

        return {
          id: doc.id,
          ...raw,
          coordinates,
        } as TechnicianPartner;
      });

      setTechnicians(data);
    };

    fetch();
  }, []);

  const icon = L.icon({
    iconUrl: '/assets/images/technician.png',
    iconSize: [28, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <>
      {technicians.map((tech) =>
        tech.coordinates &&
        typeof tech.coordinates.lat === 'number' &&
        typeof tech.coordinates.lng === 'number' &&
        tech.coordinates.lat !== 0 &&
        tech.coordinates.lng !== 0 ? (
          <Marker
            key={tech.id}
            position={[tech.coordinates.lat, tech.coordinates.lng]}
            icon={icon}
          >
            <Popup>
              <strong>{tech.name}</strong>
              <br />
              {tech.phone || ''}
            </Popup>
          </Marker>
        ) : null
      )}
    </>
  );
}
