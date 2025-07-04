'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface Props {
  vehicleType: 'car' | 'motorbike' | 'bike';
}

export default function TechnicianMarkers({ vehicleType }: Props) {
  const [technicians, setTechnicians] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'technicianPartners'), where('isActive', '==', true));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTechnicians(data);
    };
    fetch();
  }, []);

  const filtered = technicians.filter(
    (t) =>
      !t.supportedVehicleTypes || t.supportedVehicleTypes.includes(vehicleType)
  );

  const icon = L.icon({
    iconUrl: '/assets/images/technician.png',
    iconSize: [25, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <>
      {filtered.map((tech) =>
        tech.coordinates ? (
          <Marker
            key={tech.id}
            position={[tech.coordinates.lat, tech.coordinates.lng]}
            icon={icon}
          >
            <Popup>
              <strong>{tech.name}</strong><br />
              {tech.phone || ''}
            </Popup>
          </Marker>
        ) : null
      )}
    </>
  );
}
