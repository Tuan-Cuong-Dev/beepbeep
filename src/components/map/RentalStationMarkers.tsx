'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Station } from '@/src/lib/stations/stationTypes';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike'; // Optional for 'all'
}

// Icon for rental station marker
const rentalStationIcon = L.icon({
  iconUrl: '/assets/images/stationmarker.png',
  iconSize: [25, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Parse "15.8785655° N, 108.3258334° E" to [15.8785655, 108.3258334]
function parseLocationString(locationStr: string): [number, number] | null {
  try {
    const [latPart, lngPart] = locationStr.split(',');
    const lat = parseFloat(latPart);
    const lng = parseFloat(lngPart);
    if (isNaN(lat) || isNaN(lng)) return null;
    return [lat, lng];
  } catch {
    console.warn('❌ Error parsing location string:', locationStr);
    return null;
  }
}

function isMatchingType(station: Station, vehicleType?: string) {
  return !vehicleType || !station.vehicleType || station.vehicleType === vehicleType;
}

export default function RentalStationMarkers({ vehicleType }: Props) {
  const [stations, setStations] = useState<Station[]>([]);

  useEffect(() => {
    let isMounted = true;

    const fetchStations = async () => {
      try {
        const snap = await getDocs(collection(db, 'rentalStations'));
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Station, 'id'>),
        }));
        if (isMounted) setStations(data);
      } catch (err) {
        console.error('Error loading rental stations:', err);
      }
    };

    fetchStations();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {stations.map((station) => {
        if (!isMatchingType(station, vehicleType)) return null;
        const coords = typeof station.location === 'string' ? parseLocationString(station.location) : null;
        if (!coords) return null;

        const [lat, lng] = coords;

        return (
          <Marker key={station.id} position={[lat, lng]} icon={rentalStationIcon}>
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
