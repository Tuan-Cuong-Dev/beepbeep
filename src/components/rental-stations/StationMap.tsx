'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Station } from '@/src/lib/stations/stationTypes';
import { useAuth } from '@/src/hooks/useAuth'; // Hook để lấy thông tin user

// Icon mặc định cho station
const stationIcon = new L.Icon({
  iconUrl: '/assets/images/stationmarker.png',
  iconSize: [24, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function ZoomToUser({ userPosition }: { userPosition: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (userPosition) map.setView(userPosition, 15);
  }, [userPosition, map]);
  return null;
}

interface Props {
  stations: Station[];
  userLocation?: [number, number] | null;
}

export default function StationMap({ stations, userLocation }: Props) {
  const { currentUser } = useAuth(); // 🔄 Get current user info
  const [userPosition, setUserPosition] = useState<[number, number] | null>(userLocation || null);
  const [userIcon, setUserIcon] = useState<L.Icon | null>(null);

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

  // Tạo icon người dùng từ avatar hoặc icon mặc định
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

  const defaultCenter: [number, number] = [16.0471, 108.2062];
  const center: [number, number] =
    userPosition || (stations[0]?.geo
      ? [stations[0].geo.lat, stations[0].geo.lng]
      : defaultCenter);

  return (
    <div className="fixed inset-0 z-0">
      <MapContainer center={center} zoom={13} className="w-full h-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {userPosition && <ZoomToUser userPosition={userPosition} />}

        {stations.map(
          (station) =>
            station.geo?.lat != null &&
            station.geo?.lng != null && (
              <Marker
                key={station.id}
                position={[station.geo.lat, station.geo.lng]}
                icon={stationIcon}
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
            )
        )}

        {userPosition && userIcon && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              🧍 You are here<br />
              Lat: {userPosition[0].toFixed(5)}<br />
              Lng: {userPosition[1].toFixed(5)}
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
