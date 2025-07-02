'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Station } from '@/src/lib/stations/stationTypes';

// Biểu tượng marker cho station
const stationIcon = new L.Icon({
  iconUrl: '/assets/images/station-marker.png',
  iconSize: [24, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Biểu tượng marker cho vị trí người dùng
const userIcon = new L.Icon({
  iconUrl: '/assets/images/user-location.png', // bạn có thể đổi sang icon màu xanh hoặc định vị
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

interface Props {
  stations: Station[];
}

export default function StationMap({ stations }: Props) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);

  // Lấy vị trí hiện tại
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn('📍 Could not get location:', err);
        }
      );
    }
  }, []);

  const defaultCenter: [number, number] = [16.0471, 108.2062]; // fallback Đà Nẵng
  const center: [number, number] =
    userPosition || stations[0]?.geo
      ? [stations[0]?.geo?.lat || 0, stations[0]?.geo?.lng || 0]
      : defaultCenter;

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Hiển thị các trạm */}
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

        {/* Vị trí người dùng */}
        {userPosition && (
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
