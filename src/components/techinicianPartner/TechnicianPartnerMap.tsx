'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useEffect, useState } from 'react';
import L from 'leaflet';

interface Props {
  partners: TechnicianPartner[];
}

const userIcon = L.icon({
  iconUrl: '/user-location.png', // 👉 bạn cần đặt icon này trong /public
  iconSize: [32, 32],
});

export default function TechnicianMap({ partners }: Props) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const defaultCenter: [number, number] = userLocation ?? [16.0471, 108.2062]; // Đà Nẵng fallback

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden mb-8">
      <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom className="h-full w-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* Marker người dùng */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Marker technician */}
        {partners
          .filter((p) => p.coordinates)
          .map((p) => (
            <Marker key={p.id} position={[p.coordinates!.lat, p.coordinates!.lng]}>
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {p.type} technician
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
