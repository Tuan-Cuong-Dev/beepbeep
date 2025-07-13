'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/src/hooks/useAuth'; // ✅ giả định bạn có hook này

const defaultUserIcon = L.icon({
  iconUrl: '/assets/images/usericon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface MapWrapperProps {
  children: ReactNode;
}

export default function MapWrapper({ children }: MapWrapperProps) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const { currentUser} = useAuth(); // ✅ Lấy thông tin user, ví dụ từ Firebase

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.warn('⚠️ Location error:', err)
      );
    }
  }, []);

  // ✅ Tạo icon từ avatar nếu có
  const userIcon = L.icon({
    iconUrl: currentUser?.photoURL || '/assets/images/usericon.png',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });

  const center: [number, number] = userLocation ?? [16.0471, 108.2062];

  return (
    <div className="h-full w-full z-0">
      <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {children}
      </MapContainer>
    </div>
  );
}
