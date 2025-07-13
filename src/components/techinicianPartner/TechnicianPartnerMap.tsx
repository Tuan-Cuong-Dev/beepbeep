'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { useAuth } from '@/src/hooks/useAuth'; // nếu bạn muốn dùng avatar làm icon

// Icon kỹ thuật viên
const technicianIcon = new L.Icon({
  iconUrl: '/assets/images/technician.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// FlyToUser đến user location
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
  partners: TechnicianPartner[];
  userLocation?: [number, number] | null;
}

export default function TechnicianMap({ partners, userLocation }: Props) {
  const { currentUser } = useAuth();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(userLocation || null);
  const [userIcon, setUserIcon] = useState<L.Icon | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Custom style cho leaflet control
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

  // Lấy vị trí nếu chưa có
  useEffect(() => {
    if (!userLocation && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => setLocationError(err.message)
      );
    }
  }, [userLocation]);

  // Tạo icon user từ avatar hoặc fallback
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
    <div className="h-full w-full relative flex flex-col">
      <MapContainer center={defaultCenter} zoom={13} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {/* Zoom đến vị trí người dùng */}
        {userPosition && <FlyToUser userPosition={userPosition} />}

        {/* Marker người dùng */}
        {userPosition && userIcon && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              🧍 You are here<br />
              Lat: {userPosition[0].toFixed(5)}<br />
              Lng: {userPosition[1].toFixed(5)}
            </Popup>
          </Marker>
        )}

        {/* Marker kỹ thuật viên */}
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

      {locationError && (
        <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          ⚠️ {locationError}
        </p>
      )}
    </div>
  );
}
