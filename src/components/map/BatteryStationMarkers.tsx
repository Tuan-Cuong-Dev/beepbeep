'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike';
}

export default function BatteryStationMarkers({ vehicleType }: Props) {
  const [stations, setStations] = useState<BatteryStation[]>([]);

  useEffect(() => {
    if (vehicleType === 'bike') {
      setStations([]); // ❌ Không hiển thị battery station cho bike
      return;
    }

    const fetch = async () => {
      const q = query(collection(db, 'batteryStations'), where('isActive', '==', true));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BatteryStation));
      setStations(data);
    };
    fetch();
  }, [vehicleType]);

  const filtered = stations.filter(
    (s) => !s.vehicleType || s.vehicleType === vehicleType
  );

  const icon = L.icon({
    iconUrl: '/assets/images/batterystation.png',
    iconSize: [22, 32],
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
              <strong>{station.name}</strong>
              <br />
              {station.displayAddress}
            </Popup>
          </Marker>
        ) : null
      )}
    </>
  );
}
