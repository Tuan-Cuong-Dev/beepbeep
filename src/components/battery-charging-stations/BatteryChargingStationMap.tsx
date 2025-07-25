'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';
import { useAuth } from '@/src/hooks/useAuth';
import { useTranslation } from 'react-i18next';

// Icon trạm sạc pin
const stationIcon = L.icon({
  iconUrl: '/assets/images/BatteryChargingStation.png', // <-- đổi icon phù hợp
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// Icon mặc định cho người dùng
const userIconDefault = L.icon({
  iconUrl: '/assets/images/usericon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

// ✅ Tính khoảng cách
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ✅ Zoom đến vị trí người dùng
function FlyToUser({ userPosition }: { userPosition: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(userPosition, 15, { animate: true, duration: 1.5 });
  }, [userPosition, map]);
  return null;
}

interface Props {
  stations: BatteryChargingStation[];
  userLocation?: [number, number] | null;
}

export default function BatteryChargingStationMap({ stations, userLocation }: Props) {
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(userLocation || null);
  const [userIcon, setUserIcon] = useState<L.Icon>(userIconDefault);
  const [locationError, setLocationError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.photoURL) {
      const customUserIcon = L.icon({
        iconUrl: currentUser.photoURL,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
        className: 'rounded-full border border-white shadow',
      });
      setUserIcon(customUserIcon);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!userLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => setLocationError(err.message)
      );
    }
  }, [userLocation]);

  const defaultCenter: [number, number] = [16.0471, 108.2062];
  const center: [number, number] =
    userPosition ||
    (stations[0]?.coordinates
      ? [stations[0].coordinates.lat, stations[0].coordinates.lng]
      : defaultCenter);

  return (
    <div className="h-full w-full relative flex flex-col">
      <MapContainer center={center} zoom={13} className="w-full h-full">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />

        {userPosition && <FlyToUser userPosition={userPosition} />}

        {userPosition && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              🧍 {t('battery_charging_station_map.you_are_here')}<br />
              Lat: {userPosition[0].toFixed(5)}<br />
              Lng: {userPosition[1].toFixed(5)}
            </Popup>
          </Marker>
        )}

        {stations
          .filter((s) => s.coordinates?.lat != null && s.coordinates?.lng != null)
          .map((station) => {
            let distanceText = '';
            if (userPosition && station.coordinates) {
              const dist = getDistanceKm(
                userPosition[0],
                userPosition[1],
                station.coordinates.lat,
                station.coordinates.lng
              );
              distanceText = t('battery_charging_station_map.distance_away', {
                distance: Math.round(dist * 10) / 10,
              });
            }

            return (
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
                      {station.vehicleType === 'car'
                        ? t('battery_charging_station_map.car_station')
                        : t('battery_charging_station_map.motorbike_station')}
                    </p>
                    {station.phone && (
                      <p className="text-xs text-blue-600">📞 {station.phone}</p>
                    )}
                    {distanceText && (
                      <p className="text-xs text-green-700">📍 {distanceText}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {locationError && (
        <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          ⚠️ {locationError}
        </p>
      )}
    </div>
  );
}
