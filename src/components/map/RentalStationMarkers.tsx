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
    iconSize: [28, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  return (
    <>
      {filtered.map((station) =>
        station.geo?.lat != null && station.geo?.lng != null ? (
          <Marker
            key={station.id}
            position={[station.geo.lat, station.geo.lng]}
            icon={icon}
          >
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
        ) : null
      )}
    </>
  );
}
