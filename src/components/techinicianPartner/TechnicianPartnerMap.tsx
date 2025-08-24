'use client';

import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import L from 'leaflet';
import { useAuth } from '@/src/hooks/useAuth';
import { useTranslation } from 'react-i18next';

// Icon mặc định cho technician
const technicianIcon = new L.Icon({
  iconUrl: '/assets/images/technician.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

function FlyToUser({ userPosition }: { userPosition: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (userPosition) map.setView(userPosition, 15);
  }, [userPosition, map]);
  return null;
}

// ===== Helpers =====
function parseLatLngString(s?: string): [number, number] | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

function extractLatLngFromLocation(loc: any): [number, number] | null {
  if (!loc) return null;

  if (typeof loc?.geo?.latitude === 'number' && typeof loc?.geo?.longitude === 'number') {
    return [loc.geo.latitude, loc.geo.longitude];
  }
  if (typeof loc?.location === 'string') {
    const p = parseLatLngString(loc.location);
    if (p) return p;
  }
  if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
    return [loc.lat, loc.lng];
  }
  if (typeof loc?.coordinates === 'string') {
    const p = parseLatLngString(loc.coordinates);
    if (p) return p;
  }
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

  // Lấy vị trí user nếu prop không truyền
  useEffect(() => {
    if (!userLocation && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => setLocationError(err.message)
      );
    }
  }, [userLocation]);

  // Icon user (dùng avatar nếu có)
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

  // Tính điểm hợp lệ từ partners
  const partnerPoints = useMemo(() => {
    return partners
      .map((p) => {
        const coord = extractLatLngFromLocation(p.location);
        return coord ? { p, coord } : null;
      })
      .filter((x): x is { p: TechnicianPartner; coord: [number, number] } => !!x);
  }, [partners]);

  const defaultCenter: [number, number] = [16.0471, 108.2062];
  const center: [number, number] =
    userPosition ?? partnerPoints[0]?.coord ?? defaultCenter;

  return (
    <div className="h-full w-full relative flex flex-col">
      <MapContainer center={center} zoom={13} className="w-full h-full">
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

        {partnerPoints.map(({ p, coord }) => (
          <Marker key={p.id ?? `${coord[0]}-${coord[1]}`} position={coord} icon={technicianIcon}>
            <Popup>
              <div className="text-sm leading-snug max-w-[240px]">
                <p className="font-semibold text-black">{p.name}</p>
                <p className="text-gray-700 text-xs mb-1">
                  {t(p.type === 'shop' ? 'technician_map.shop_technician' : 'technician_map.mobile_technician')}
                </p>
                <p className="text-gray-600 text-xs">
                  📍 {p.location?.address || t('technician_map.no_address')}
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
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-sm text-red-500 bg-white px-3 py-1 rounded shadow">
          {t('technician_map.location_error', { message: locationError })}
        </p>
      )}
    </div>
  );
}
