'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Station } from '@/src/lib/stations/stationTypes';
import { useAuth } from '@/src/hooks/useAuth';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(userLocation || null);
  const [userIcon, setUserIcon] = useState<L.Icon | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // CSS để giữ nút zoom(+/-) chính phía trên trái
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      .leaflet-top.leaflet-left {
        top: 4 !important;
        left: 1/2 !important;
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
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => setLocationError(t('station_map.getting_location_failed') + ': ' + err.message)
      );
    }
  }, [userLocation, t]);

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
    <div className="h-full w-full relative flex flex-col">
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
                      📞 {t('station_map.phone')}: {station.contactPhone}
                    </>
                  )}
                </Popup>
              </Marker>
            )
        )}

        {userPosition && userIcon && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              🧍 {t('station_map.you_are_here')}
              <br />
              {t('station_map.latitude')}: {userPosition[0].toFixed(5)}
              <br />
              {t('station_map.longitude')}: {userPosition[1].toFixed(5)}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {locationError && (
        <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          ⚠️ {locationError}
        </p>
      )}
    </div>
  );
}
