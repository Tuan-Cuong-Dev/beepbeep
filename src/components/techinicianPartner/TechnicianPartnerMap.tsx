'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// ✅ Tạo icon riêng cho người dùng và kỹ thuật viên
const userIcon = L.icon({
  iconUrl: '/assets/images/user-icon.png', // bạn có thể thay bằng icon người dùng riêng nếu có
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const technicianIcon = L.icon({
  iconUrl: '/assets/images/Logo-xanh.png', // icon kỹ thuật viên
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

interface Props {
  partners: TechnicianPartner[];
}

export default function TechnicianMap({ partners }: Props) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLocation([pos.coords.latitude, pos.coords.longitude]);
      });
    }
  }, []);

  const defaultCenter: [number, number] = userLocation ?? [16.0471, 108.2062]; // Đà Nẵng fallback

  // ❗ Ngăn render khi đang ở SSR
  if (typeof window === 'undefined') return null;

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden mb-8 z-0">
      <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* Vị trí người dùng */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {/* Vị trí Technician */}
        {partners
          .filter((p) => p.coordinates)
          .map((p) => (
            <Marker
              key={p.id}
              position={[p.coordinates!.lat, p.coordinates!.lng]}
              icon={technicianIcon} // ✅ sử dụng icon tuỳ chỉnh
            >
              <Popup>
                <strong>{p.name}</strong>
                <br />
                {p.type === 'shop' ? 'Shop Technician' : 'Mobile Technician'}
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
