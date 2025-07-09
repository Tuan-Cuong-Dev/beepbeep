'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import L from 'leaflet';

// Icon
const stationIcon = L.icon({
  iconUrl: '/assets/images/batterystation_new.png', // cần có icon phù hợp
  iconSize: [32, 38],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const userIcon = L.icon({
  iconUrl: '/assets/images/usericon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function FlyToUser({ location }: { location: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(location, 13);
  }, [location, map]);
  return null;
}

interface Props {
  stations: BatteryStation[];
}

export default function BatteryStationMap({ stations }: Props) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => setLocationError(err.message)
      );
    }
  }, []);

  const defaultCenter: [number, number] = userLocation ?? [16.0471, 108.2062];

  if (typeof window === 'undefined') return null;

  return (
    <div className="relative h-[500px] w-full rounded-xl overflow-hidden mb-8 z-0">
      <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
            <FlyToUser location={userLocation} />
          </>
        )}

        {stations
          .filter((s) => s.coordinates)
          .map((station) => (
            <Marker
              key={station.id}
              position={[station.coordinates!.lat, station.coordinates!.lng]}
              icon={stationIcon}
            >
              <Popup>
                <div className="text-sm max-w-[220px]">
                  <p className="font-semibold">{station.name}</p>
                  <p className="text-xs text-gray-600">{station.displayAddress}</p>
                  <p className="text-xs text-gray-500">
                    🚗 {station.vehicleType === 'car' ? 'Car' : 'Motorbike'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {locationError && (
        <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          ⚠️ {locationError}
        </p>
      )}
    </div>
  );
}
