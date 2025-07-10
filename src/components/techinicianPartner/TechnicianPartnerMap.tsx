'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useEffect, useState } from 'react';
import L from 'leaflet';

// ✅ Tạo icon riêng cho người dùng và kỹ thuật viên
const userIcon = L.icon({
  iconUrl: '/assets/images/usericon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const technicianIcon = L.icon({
  iconUrl: '/assets/images/technician.png',
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
  partners: TechnicianPartner[];
}

export default function TechnicianMap({ partners }: Props) {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        (error) => {
          setLocationError(error.message);
          console.warn('Geolocation error:', error.message);
        }
      );
    }
  }, []);

  const defaultCenter: [number, number] = userLocation ?? [16.0471, 108.2062]; // Đà Nẵng fallback

  if (typeof window === 'undefined') return null;

  return (
    <div className="relative h-[500px] w-full rounded-xl overflow-hidden mb-8 z-0">
      <MapContainer center={defaultCenter} zoom={13} scrollWheelZoom className="h-full w-full z-0">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* Vị trí người dùng */}
        {userLocation && (
          <>
            <Marker position={userLocation} icon={userIcon}>
              <Popup>You are here</Popup>
            </Marker>
            <FlyToUser location={userLocation} />
          </>
        )}

        {/* Vị trí Technician */}
        {partners
          .filter((p) => p.coordinates)
          .map((p) => (
            <Marker
              key={p.id}
              position={[p.coordinates!.lat, p.coordinates!.lng]}
              icon={technicianIcon}
            >
              <Popup>
                <div className="text-sm leading-snug max-w-[220px]">
                  <p className="font-semibold text-black">{p.name}</p>
                  <p className="text-gray-700 text-xs mb-1">
                    {p.type === 'shop' ? 'Shop Technician' : 'Mobile Technician'}
                  </p>
                  <p className="text-gray-600 text-xs">📍 {p.shopAddress || 'No address'}</p>
                  <p className="text-gray-600 text-xs mb-1">📞 {p.phone || 'No phone'}</p>

                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="inline-block text-xs text-white bg-green-500 px-3 py-1 rounded mt-1 hover:bg-green-600"
                    >
                      📞 Call Now
                    </a>
                  )}
                </div>
              </Popup>

            </Marker>
          ))}
      </MapContainer>

      {/* Thông báo lỗi vị trí nếu có */}
      {locationError && (
        <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          ⚠️ {locationError}
        </p>
      )}
    </div>
  );
}
