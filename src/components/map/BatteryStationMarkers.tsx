'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

interface Props {
  vehicleType: 'car' | 'motorbike' | 'bike';
}

export default function BatteryStationMarkers({ vehicleType }: Props) {
  const [stations, setStations] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'batteryStations'), where('isActive', '==', true));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setStations(data);
    };
    fetch();
  }, []);

  const filtered = stations.filter((s) => s.vehicleType === vehicleType);

  const icon = L.icon({
    iconUrl: '/assets/icons/battery-station.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <>
      {filtered.map((station) =>
        station.coordinates ? (
          <Marker
            key={station.id}
            position={[station.coordinates.lat, station.coordinates.lng]}
            icon={icon}
          >
            <Popup>
              <strong>{station.name}</strong><br />
              {station.displayAddress}
            </Popup>
          </Marker>
        ) : null
      )}
    </>
  );
}
