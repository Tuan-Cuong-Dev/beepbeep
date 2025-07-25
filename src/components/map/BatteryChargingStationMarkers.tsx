'use client';

import { useEffect, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';
import { useTranslation } from 'react-i18next';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike';
}

const chargingIcon = L.icon({
  iconUrl: '/assets/images/BatteryChargingStation.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function isValidLatLng(lat: any, lng: any): boolean {
  return typeof lat === 'number' && !isNaN(lat) && typeof lng === 'number' && !isNaN(lng);
}

export default function BatteryChargingStationMarkers({ vehicleType }: Props) {
  const { t } = useTranslation();
  const [stations, setStations] = useState<BatteryChargingStation[]>([]);

  useEffect(() => {
    if (vehicleType === 'bike') {
      setStations([]);
      return;
    }

    let isMounted = true;

    const fetchChargingStations = async () => {
      try {
        const q = query(collection(db, 'batteryChargingStations'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as BatteryChargingStation));
        if (isMounted) setStations(data);
      } catch (error) {
        console.error('Error fetching battery charging stations:', error);
      }
    };

    fetchChargingStations();

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
            icon={chargingIcon}
          >
            <Popup>
              <div className="text-sm max-w-[220px]">
                <p className="font-semibold text-black">{station.name}</p>
                <p className="text-xs text-gray-600">{station.displayAddress}</p>
                {station.phone && (
                  <p className="text-xs text-blue-600">📞 {station.phone}</p>
                )}
                {station.description && (
                  <p className="text-xs mt-1 text-gray-700">{station.description}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
    </>
  );
}
