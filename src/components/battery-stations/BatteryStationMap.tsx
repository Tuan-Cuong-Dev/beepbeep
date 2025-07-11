'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import { useAuth } from '@/src/hooks/useAuth';
import L from 'leaflet';

// Icon trạm đổi pin
const stationIcon = L.icon({
  iconUrl: '/assets/images/batterystation_new.png',
  iconSize: [32, 38],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Icon người dùng mặc định
const userIconDefault = L.icon({
  iconUrl: '/assets/images/usericon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

// Zoom đến vị trí người dùng
function FlyToUser({ userPosition }: { userPosition: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(userPosition, 15, {
      animate: true,
      duration: 1.5,
    });
  }, [userPosition, map]);
  return null;
}

interface Props {
  stations: BatteryStation[];
  userLocation?: [number, number] | null;
}

export default function BatteryStationMap({ stations, userLocation }: Props) {
  const { currentUser } = useAuth();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(userLocation || null);
  const [userIcon, setUserIcon] = useState<L.Icon>(userIconDefault);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Lấy vị trí người dùng nếu chưa có
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn('📍 Could not get location:', err);
        }
      );
    }
  }, [userLocation]);

  // Lấy vị trí nếu chưa có
  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => setLocationError(err.message)
      );
    }
  }, [userLocation]);

  // CSS tùy chỉnh
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-top.leaflet-left {
        top: 80px !important;
        left: 12px !important;
        z-index: 1001 !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const defaultCenter: [number, number] = [16.0471, 108.2062];
  const center: [number, number] =
    userPosition ||
    (stations[0]?.coordinates
      ? [stations[0].coordinates.lat, stations[0].coordinates.lng]
      : defaultCenter);

  return (
    <div className="fixed inset-0 z-0">
      <MapContainer center={center} zoom={13} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* Zoom đến vị trí người dùng */}
        {userPosition && <FlyToUser userPosition={userPosition} />}

        {/* Marker người dùng */}
        {userPosition && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              🧍 You are here<br />
              Lat: {userPosition[0].toFixed(5)}<br />
              Lng: {userPosition[1].toFixed(5)}
            </Popup>
          </Marker>
        )}

        {/* Marker các trạm đổi pin */}
        {stations
          .filter((s) => s.coordinates?.lat != null && s.coordinates?.lng != null)
          .map((station) => (
            <Marker
              key={station.id}
              position={[station.coordinates!.lat, station.coordinates!.lng]}
              icon={stationIcon}
            >
              <Popup>
                <div className="text-sm max-w-[220px]">
                  <p className="font-semibold text-black">{station.name}</p>
                  <p className="text-xs text-gray-600">{station.displayAddress}</p>
                  <p className="text-xs text-gray-500">
                    🚗 {station.vehicleType === 'car' ? 'Car' : 'Motorbike'}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Lỗi khi lấy vị trí */}
      {locationError && (
        <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          ⚠️ {locationError}
        </p>
      )}
    </div>
  );
}
