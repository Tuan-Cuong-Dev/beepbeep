'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useState, ReactNode } from 'react';
import L from 'leaflet';
import { useAuth } from '@/src/hooks/useAuth';

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

interface MapWrapperProps {
  children: ReactNode;
}

export default function MapWrapper({ children }: MapWrapperProps) {
  const { currentUser } = useAuth();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [userIcon, setUserIcon] = useState<L.Icon | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Lấy vị trí người dùng
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => setLocationError(err.message)
      );
    }
  }, []);

  // Tạo icon avatar nếu có
  useEffect(() => {
    const icon = new L.Icon({
      iconUrl: currentUser?.photoURL || '/assets/images/usericon.png',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -28],
      className: 'rounded-full border border-white shadow-md',
    });
    setUserIcon(icon);
  }, [currentUser?.photoURL]);

  const defaultCenter: [number, number] = userPosition ?? [16.0471, 108.2062];

  return (
    <div className="h-full w-full z-0">
      <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* 👤 Marker vị trí người dùng */}
        {userPosition && userIcon && (
          <>
            <FlyToUser userPosition={userPosition} />
            <Marker position={userPosition} icon={userIcon}>
              <Popup>
                🧍 You are here<br />
                Lat: {userPosition[0].toFixed(5)}<br />
                Lng: {userPosition[1].toFixed(5)}
              </Popup>
            </Marker>
          </>
        )}

        {children}
      </MapContainer>

      {locationError && (
        <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          ⚠️ {locationError}
        </p>
      )}
    </div>
  );
}
