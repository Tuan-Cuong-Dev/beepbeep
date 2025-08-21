'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { useTranslation } from 'react-i18next';

// SSR-safe react-leaflet
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker), { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });
const useMap = () => {
  const m = require('react-leaflet');
  return m.useMap() as ReturnType<typeof m.useMap>;
};

type LatLng = { lat: number; lng: number };

interface NearbySupportMapProps {
  issueCoords?: LatLng | null;       // vị trí sự cố đang xem
  issues?: PublicVehicleIssue[];     // toàn bộ issues (sẽ tự lọc trạng thái mở)
  limitPerType?: number;             // số shop/mobile hiển thị mỗi loại
}

/** Chuẩn hoá "lat,lng" | {lat,lng} -> {lat,lng} */
function normalizeCoords(coords: any): LatLng | null {
  if (!coords) return null;
  if (typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    const lat = Number(coords.lat); const lng = Number(coords.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  if (typeof coords === 'string' && coords.includes(',')) {
    const [latStr, lngStr] = coords.split(',').map((s: string) => s.trim());
    const lat = Number(latStr); const lng = Number(lngStr);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }
  return null;
}

/** Haversine (km) */
function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function FitToMarkers({ center, others }: { center?: LatLng; others: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    const pts = [...others];
    if (center) pts.push(center);
    if (!pts.length) return;
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const southWest = [Math.min(...lats), Math.min(...lngs)] as [number, number];
    const northEast = [Math.max(...lats), Math.max(...lngs)] as [number, number];
    map.fitBounds([southWest, northEast], { padding: [40, 40] });
  }, [center?.lat, center?.lng, others.map((p) => `${p.lat},${p.lng}`).join('|')]);
  return null;
}

/** Các trạng thái “mở” cần hiển thị */
const OPEN_STATUSES: PublicIssueStatus[] = [
  'pending',
  'assigned',
  'proposed',
  'confirmed',
  'rejected',
  'in_progress',
];

/** Màu theo trạng thái (dùng cho legend/nhãn) */
const statusColor: Record<PublicIssueStatus, string> = {
  pending: '#ef4444',
  assigned: '#fb923c',
  proposed: '#f59e0b',
  confirmed: '#10b981',
  rejected: '#f43f5e',
  in_progress: '#6366f1',
  resolved: '#9333ea',
  closed: '#6b7280',
};

export default function NearbySupportMap({
  issueCoords,
  issues = [],
  limitPerType = 5,
}: NearbySupportMapProps) {
  const { t } = useTranslation('common', { keyPrefix: 'map' });

  const [shops, setShops] = useState<TechnicianPartner[]>([]);
  const [mobiles, setMobiles] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Load đối tác (shop/mobile)
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const shopsQ = query(
          collection(db, 'technicianPartners'),
          where('isActive', '==', true),
          where('type', '==', 'shop'),
        );
        const mobilesQ = query(
          collection(db, 'technicianPartners'),
          where('isActive', '==', true),
          where('type', '==', 'mobile'),
        );
        const [shopsSnap, mobilesSnap] = await Promise.all([getDocs(shopsQ), getDocs(mobilesQ)]);
        if (!mounted) return;
        const parse = (d: any): TechnicianPartner => ({ id: d.id, ...d.data() });
        setShops(shopsSnap.docs.map(parse));
        setMobiles(mobilesSnap.docs.map(parse));
      } catch (e) {
        console.error('Load partners failed', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Top N cửa hàng quanh issue
  const topShops = useMemo(() => {
    if (!issueCoords) return [];
    return shops
      .map((p) => ({ p, coord: normalizeCoords(p.coordinates) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord)
      .map((x) => ({ ...x, d: distanceKm(issueCoords, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [shops, issueCoords, limitPerType]);

  // Top N KTV lưu động quanh issue
  const topMobiles = useMemo(() => {
    if (!issueCoords) return [];
    return mobiles
      .map((p) => ({ p, coord: normalizeCoords(p.coordinates) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord)
      .map((x) => ({ ...x, d: distanceKm(issueCoords, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [mobiles, issueCoords, limitPerType]);

  // Lấy các issue “mở”
  const openIssuePoints = useMemo(() => {
    return (issues || [])
      .filter((i) => OPEN_STATUSES.includes(i.status))
      .map((i) => {
        const coord = normalizeCoords(i.location?.coordinates);
        return coord ? { issue: i, coord } : null;
      })
      .filter((x): x is { issue: PublicVehicleIssue; coord: LatLng } => !!x)
      // tránh trùng marker focus (nếu gần <~10m)
      .filter((x) => !issueCoords || distanceKm(issueCoords, x.coord) > 0.01);
  }, [issues, issueCoords]);

  // Tính bounds
  const otherPoints: LatLng[] = useMemo(() => {
    return [
      ...topShops.map((x) => x.coord),
      ...topMobiles.map((x) => x.coord),
      ...openIssuePoints.map((x) => x.coord),
    ];
  }, [topShops, topMobiles, openIssuePoints]);

  if (!issueCoords && openIssuePoints.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">{t('no_location_data')}</div>
      </div>
    );
  }

  // Icon pulse cho tất cả sự cố (đang xem + mở)
  const pulseIcon = useMemo(() => {
    if (!isClient) return null;
    const L = require('leaflet');
    return L.divIcon({
      className: 'pulse-marker',
      html: '<span class="pulse-dot"></span>',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }, [isClient]);

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-3">
        <div className="font-semibold">{t('title')}</div>
        {loading && <div className="text-xs text-gray-500">{t('loading_partners')}</div>}
      </div>

      <div className="h-[460px] w-full">
        {isClient && (
          <MapContainer
            center={
              issueCoords
                ? [issueCoords.lat, issueCoords.lng]
                : [openIssuePoints[0].coord.lat, openIssuePoints[0].coord.lng]
            }
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            <FitToMarkers center={issueCoords || undefined} others={otherPoints} />

            {/* ⭐ Sự cố đang xem (pulse) */}
            {issueCoords && pulseIcon && (
              <Marker position={[issueCoords.lat, issueCoords.lng]} icon={pulseIcon}>
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{t('focus_issue')}</div>
                    <div className="mt-1 font-mono text-xs">
                      {issueCoords.lat.toFixed(6)}, {issueCoords.lng.toFixed(6)}
                    </div>
                    <a
                      className="text-blue-600 underline text-xs"
                      href={`https://www.google.com/maps/search/?api=1&query=${issueCoords.lat},${issueCoords.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('open_on_maps')}
                    </a>
                  </div>
                </Popup>
              </Marker>
            )}

            {/* 🔔 Các sự cố mở (cũng pulse) */}
            {openIssuePoints.map(({ issue, coord }) => (
              <Marker
                key={`open-${issue.id}-${coord.lat}-${coord.lng}`}
                position={[coord.lat, coord.lng]}
                icon={pulseIcon}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">
                      {issue.customerName} — <span className="capitalize">{t(`status.${issue.status}`)}</span>
                    </div>
                    {issue.phone && (
                      <div className="text-xs text-gray-600">
                        {t('phone_short')}: {issue.phone}
                      </div>
                    )}
                    {issue.location?.issueAddress && (
                      <div className="text-xs mt-1">{issue.location.issueAddress}</div>
                    )}
                    <div className="mt-1 font-mono text-[11px]">
                      {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                    </div>
                    <a
                      className="text-blue-600 underline text-xs"
                      href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('open_on_maps')}
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* 🟦 Cửa hàng gần nhất (tĩnh) */}
            {topShops.map(({ p, coord, d }) => (
              <CircleMarker
                key={`shop-${p.id}`}
                center={[coord.lat, coord.lng]}
                radius={8}
                pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.5 }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{p.shopName || p.name || t('shop_fallback')}</div>
                    {p.phone && (
                      <div className="text-xs mt-1">
                        {t('phone_short')}: <a className="underline" href={`tel:${p.phone}`}>{p.phone}</a>
                      </div>
                    )}
                    {p.shopAddress && <div className="text-xs mt-1">{p.shopAddress}</div>}
                    <div className="text-xs mt-1">{t('distance_km', { val: d.toFixed(2) })}</div>
                    <a
                      className="text-blue-600 underline text-xs mt-1 inline-block"
                      href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('open_on_maps')}
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

            {/* 🟩 KTV lưu động gần nhất (tĩnh) */}
            {topMobiles.map(({ p, coord, d }) => (
              <CircleMarker
                key={`mobile-${p.id}`}
                center={[coord.lat, coord.lng]}
                radius={8}
                pathOptions={{ color: '#00d289', weight: 2, fillOpacity: 0.5 }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold">{p.name || t('mobile_fallback')}</div>
                    {p.phone && (
                      <div className="text-xs mt-1">
                        {t('phone_short')}: <a className="underline" href={`tel:${p.phone}`}>{p.phone}</a>
                      </div>
                    )}
                    {p.mapAddress && <div className="text-xs mt-1">{p.mapAddress}</div>}
                    <div className="text-xs mt-1">{t('distance_km', { val: d.toFixed(2) })}</div>
                    <a
                      className="text-blue-600 underline text-xs mt-1 inline-block"
                      href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('open_on_maps')}
                    </a>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#f59e0b' }} />
          {t('legend.viewing_issue')}
        </div>

        {(['pending','assigned','proposed','confirmed','rejected','in_progress'] as PublicIssueStatus[]).map(st => (
          <div className="flex items-center gap-2" key={st}>
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: statusColor[st] }} />
            {t(`status.${st}`)}
          </div>
        ))}

        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#2563eb' }} />
          {t('legend.nearest_shop')}
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#00d289' }} />
          {t('legend.nearest_mobile')}
        </div>
      </div>

      {/* CSS pulse cho marker sự cố */}
      <style jsx global>{`
        .pulse-marker { position: relative; }
        .pulse-marker .pulse-dot {
          position: relative; display: block; width: 16px; height: 16px; border-radius: 9999px;
          background: #f59e0b;
          box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6);
          animation: pulse-dot 1.5s infinite;
        }
        .pulse-marker .pulse-dot::after {
          content: ''; position: absolute; inset: -8px; border-radius: 9999px;
          border: 2px solid rgba(245, 158, 11, 0.5); animation: pulse-ring 1.5s infinite;
        }
        @keyframes pulse-dot {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.6); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 12px rgba(245, 158, 11, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(245, 158, 11, 0); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 0.7; }
          70% { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
