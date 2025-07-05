'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Station } from '@/src/lib/stations/stationTypes';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike'; // ✅ optional for 'all'
}

// ✅ Hàm parse từ chuỗi "15.8785655° N, 108.3258334° E" → [15.8785655, 108.3258334]
function parseLocationString(locationStr: string): [number, number] | null {
  try {
    const [latPart, lngPart] = locationStr.split(',');
    const lat = parseFloat(latPart);
    const lng = parseFloat(lngPart);
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  } catch (e) {
    console.warn('❌ Error parsing location string:', locationStr);
    return null;
  }
}

export default function RentalStationMarkers({ vehicleType }: Props) {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const snap = await getDocs(collection(db, 'rentalStations'));
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Station, 'id'>),
      }));
      setStations(data);
    };
    fetch();
  }, []);

  const filtered = vehicleType
    ? stations.filter((s) => !s.vehicleType || s.vehicleType === vehicleType)
    : stations;

  const icon = L.icon({
    iconUrl: '/assets/images/stationmarker.png',
    iconSize: [25, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <>
      {filtered.map((station) => {
        const parsed = typeof station.location === 'string' ? parseLocationString(station.location) : null;
        if (!parsed) return null;

        const [lat, lng] = parsed;

        return (
          <Marker key={station.id} position={[lat, lng]} icon={icon}>
            <Popup>
              <strong>{station.name}</strong>
              <br />
              {station.displayAddress}
              {station.contactPhone && (
                <>
                  <br />
                  📞 {station.contactPhone}
                </>
              )}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
