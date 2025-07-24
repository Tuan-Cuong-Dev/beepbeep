'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import { useAuth } from '@/src/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const technicianIcon = new L.Icon({
  iconUrl: '/assets/images/technician.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

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
  const { t } = useTranslation('common');
  const { currentUser } = useAuth();

  const [userPosition, setUserPosition] = useState<[number, number] | null>(userLocation || null);
  const [userIcon, setUserIcon] = useState<L.Icon | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!userLocation && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => setLocationError(err.message)
      );
    }
  }, [userLocation]);

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

        {userPosition && <FlyToUser userPosition={userPosition} />}

        {userPosition && userIcon && (
          <Marker position={userPosition} icon={userIcon}>
            <Popup>
              <div className="text-sm">
                <p>{t('technician_map.you_are_here')}</p>
                <p>{t('technician_map.lat', { lat: userPosition[0].toFixed(5) })}</p>
                <p>{t('technician_map.lng', { lng: userPosition[1].toFixed(5) })}</p>
              </div>
            </Popup>
          </Marker>
        )}

        {partners
          .filter(
            (p) =>
              p.coordinates &&
              typeof p.coordinates.lat === 'number' &&
              typeof p.coordinates.lng === 'number' &&
              !isNaN(p.coordinates.lat) &&
              !isNaN(p.coordinates.lng)
          )
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
                    {t(
                      p.type === 'shop'
                        ? 'technician_map.shop_technician'
                        : 'technician_map.mobile_technician'
                    )}
                  </p>
                  <p className="text-gray-600 text-xs">
                    📍 {p.shopAddress || t('technician_map.no_address')}
                  </p>
                  <p className="text-gray-600 text-xs mb-1">
                    📞 {p.phone || t('technician_map.no_phone')}
                  </p>

                  {p.phone && (
                    <a
                      href={`tel:${p.phone}`}
                      className="inline-block text-xs text-white bg-green-500 px-3 py-1 rounded mt-1 hover:bg-green-600"
                    >
                      {t('technician_map.call_now')}
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {locationError && (
        <p className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          {t('technician_map.location_error', { message: locationError })}
        </p>
      )}
    </div>
  );
}
