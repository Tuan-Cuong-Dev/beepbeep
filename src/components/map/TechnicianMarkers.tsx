'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike'; // Reserved for future use
}

const technicianIcon = L.icon({
  iconUrl: '/assets/images/technician.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function isValidLatLng(lat: any, lng: any): boolean {
  return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
}

export default function TechnicianMarkers({ vehicleType }: Props) {
  const [technicians, setTechnicians] = useState<TechnicianPartner[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchTechnicians = async () => {
      try {
        const q = query(collection(db, 'technicianPartners'), where('isActive', '==', true));
        const snap = await getDocs(q);

        const data = snap.docs.map((doc) => {
          const raw = doc.data();
          const lat = raw.coordinates?.latitude ?? raw.coordinates?.lat;
          const lng = raw.coordinates?.longitude ?? raw.coordinates?.lng;

          return {
            id: doc.id,
            ...raw,
            coordinates: { lat, lng },
          } as TechnicianPartner;
        });

        if (isMounted) setTechnicians(data);
      } catch (err) {
        console.error('Error fetching technician partners:', err);
      }
    };

    fetchTechnicians();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {technicians.map((tech) => {
        const { coordinates, name, phone } = tech;
        if (!coordinates || !isValidLatLng(coordinates.lat, coordinates.lng)) return null;

        return (
          <Marker
            key={tech.id}
            position={[coordinates.lat, coordinates.lng]}
            icon={technicianIcon}
          >
            <Popup>
              <strong>{name}</strong>
              {phone && (
                <>
                  <br />
                  📞 {phone}
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
