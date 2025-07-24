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

const batteryIcon = L.icon({
  iconUrl: '/assets/images/batterystation_new.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function isValidLatLng(lat: any, lng: any): boolean {
  return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
}

export default function BatteryStationMarkers({ vehicleType }: Props) {
  const [stations, setStations] = useState<BatteryStation[]>([]);

  useEffect(() => {
    if (vehicleType === 'bike') {
      setStations([]);
      return;
    }

    let isMounted = true;

    const fetchBatteryStations = async () => {
      try {
        const q = query(collection(db, 'batteryStations'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BatteryStation));
        if (isMounted) setStations(data);
      } catch (error) {
        console.error('Error fetching battery stations:', error);
      }
    };

    fetchBatteryStations();

    return () => {
      isMounted = false;
    };
  }, [vehicleType]);

  return (
    <>
      {stations
        .filter((station) => {
          const isMatchingType =
            !vehicleType || !station.vehicleType || station.vehicleType === vehicleType;
          const coords = station.coordinates;
          return (
            isMatchingType &&
            coords &&
            isValidLatLng(coords.lat, coords.lng)
          );
        })
        .map((station) => (
          <Marker
            key={station.id}
            position={[station.coordinates!.lat, station.coordinates!.lng]}
            icon={batteryIcon}
          >
            <Popup>
              <strong>{station.name}</strong>
              <br />
              {station.displayAddress}
            </Popup>
          </Marker>
        ))}
    </>
  );
}
