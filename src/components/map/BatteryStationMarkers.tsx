'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

const batteryIcon = L.icon({
  iconUrl: '/assets/icons/battery-station.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

export default function BatteryStationMarkers() {
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

  return (
    <>
      {stations.map((station) =>
        station.coordinates ? (
          <Marker
            key={station.id}
            position={[station.coordinates.lat, station.coordinates.lng]}
            icon={batteryIcon}
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
