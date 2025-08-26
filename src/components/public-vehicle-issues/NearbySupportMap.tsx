'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { collection, getDocs, query, where, GeoPoint } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';
import { useTranslation } from 'react-i18next';
import type { User } from '@/src/lib/users/userTypes';

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

// 1) Thêm helper ở gần đầu file:
function getEffectiveStatus(i: PublicVehicleIssue): PublicIssueStatus {
  // Nếu đang ở bước đề xuất nhưng bị từ chối bởi technician_assistant → coi như 'rejected'
  if (i.status === 'proposed' && i.approveStatus === 'rejected') return 'rejected';
  return i.status;
}

interface NearbySupportMapProps {
  issueCoords?: LatLng | null;
  issues?: PublicVehicleIssue[];
  limitPerType?: number;
  /** Bật/tắt lớp “Cửa hàng gần nhất” (shop) */
  showNearestShops?: boolean;
  /** Bật/tắt lớp “KTV lưu động gần nhất” (mobile) */
  showNearestMobiles?: boolean;
}

// ===== Helpers =====
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

function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** LocationCore → LatLng (ưu tiên geo; rớt xuống string "lat,lng") */
function extractLatLngFromLocationCore(loc?: LocationCore | null): LatLng | null {
  if (!loc) return null;
  if (typeof loc.geo?.latitude === 'number' && typeof loc.geo?.longitude === 'number') {
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }
  const parsed = parseLatLngString(loc.location);
  return parsed ?? null;
}

/** PublicVehicleIssue.location có thể theo chuẩn LocationCore-like */
function extractLatLngFromIssueLocation(issue: PublicVehicleIssue): LatLng | null {
  const loc: any = issue.location;
  if (loc) {
    if (typeof loc?.geo?.latitude === 'number' && typeof loc?.geo?.longitude === 'number') {
      return { lat: loc.geo.latitude, lng: loc.geo.longitude };
    }
    const fromStr = parseLatLngString(loc.location || loc.coordinates);
    if (fromStr) return fromStr;
  }
  if (issue?.location?.coordinates) {
    const c = issue.location.coordinates as any;
    if (typeof c?.lat === 'number' && typeof c?.lng === 'number') return { lat: c.lat, lng: c.lng };
    const fromStr = parseLatLngString(typeof c === 'string' ? c : undefined);
    if (fromStr) return fromStr;
  }
  return null;
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

/** Màu theo trạng thái (legend) */
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

/** Chuẩn hoá Location-like → LocationCore (bắt buộc có geo: GeoPoint) */
function toLocationCore(loc: any): LocationCore | null {
  if (!loc) return null;

  if (loc.geo instanceof GeoPoint) {
    return loc as LocationCore;
  }
  if (loc.geo && typeof loc.geo.latitude === 'number' && typeof loc.geo.longitude === 'number') {
    return {
      geo: new GeoPoint(loc.geo.latitude, loc.geo.longitude),
      location: typeof loc.location === 'string' ? loc.location : `${loc.geo.latitude},${loc.geo.longitude}`,
      address: loc.address,
      updatedAt: loc.updatedAt,
    };
  }
  if (typeof loc.location === 'string') {
    const parsed = parseLatLngString(loc.location);
    if (parsed) {
      return {
        geo: new GeoPoint(parsed.lat, parsed.lng),
        location: `${parsed.lat},${parsed.lng}`,
        address: loc.address,
        updatedAt: loc.updatedAt,
      };
    }
  }
  return null;
}

export default function NearbySupportMap({
  issueCoords,
  issues = [],
  limitPerType = 5,
  showNearestShops = true,
  showNearestMobiles = true,
}: NearbySupportMapProps) {
  const { t } = useTranslation('common', { keyPrefix: 'map' });

  const [shops, setShops] = useState<TechnicianPartner[]>([]);
  const [mobiles, setMobiles] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  // Load đối tác có điều kiện theo flags
  useEffect(() => {
    let mounted = true;

    async function loadShops(): Promise<TechnicianPartner[]> {
      const shopsQ = query(
        collection(db, 'technicianPartners'),
        where('isActive', '==', true),
        where('type', '==', 'shop'),
      );
      const shopsSnap = await getDocs(shopsQ);
      return shopsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TechnicianPartner));
    }

    async function loadMobilesFromUsers(): Promise<TechnicianPartner[]> {
      const usersQ = query(collection(db, 'users'), where('role', '==', 'technician_partner'));
      const usersSnap = await getDocs(usersQ);
      return usersSnap.docs.map(d => {
        const u = d.data() as User;
        const normalized = toLocationCore(u.lastKnownLocation);
        const tp: TechnicianPartner = {
          id: d.id,
          userId: u.uid,
          name: u.name,
          phone: u.phone,
          email: u.email,
          role: 'technician_partner',
          type: 'mobile',
          location: (normalized ?? undefined) as any,
          assignedRegions: [],
          isActive: true,
          createdBy: u.uid,
          createdAt: (u.createdAt as any) ?? new Date(),
          updatedAt: (u.updatedAt as any) ?? new Date(),
        };
        return tp;
      });
    }

    (async () => {
      setLoading(true);
      try {
        const [shopsRes, mobilesRes] = await Promise.all([
          showNearestShops ? loadShops() : Promise.resolve([]),
          showNearestMobiles ? loadMobilesFromUsers() : Promise.resolve([]),
        ]);
        if (!mounted) return;
        setShops(shopsRes);
        setMobiles(mobilesRes);
      } catch (e) {
        console.error('Load partners failed', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [showNearestShops, showNearestMobiles]);

  // Top N cửa hàng quanh issue
  const topShops = useMemo(() => {
    if (!issueCoords || !showNearestShops) return [];
    return shops
      .map((p) => ({ p, coord: extractLatLngFromLocationCore(p.location) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord)
      .map((x) => ({ ...x, d: distanceKm(issueCoords, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [shops, issueCoords, limitPerType, showNearestShops]);

  // Top N KTV lưu động quanh issue
  const topMobiles = useMemo(() => {
    if (!issueCoords || !showNearestMobiles) return [];
    return mobiles
      .map((p) => ({ p, coord: extractLatLngFromLocationCore(p.location) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord)
      .map((x) => ({ ...x, d: distanceKm(issueCoords, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [mobiles, issueCoords, limitPerType, showNearestMobiles]);

  // Các issue “mở”
  // 2) Sửa openIssuePoints: dùng getEffectiveStatus để lọc
  const openIssuePoints = useMemo(() => {
    return (issues || [])
      .filter((i) => OPEN_STATUSES.includes(getEffectiveStatus(i)))  // ⬅️ dùng hiệu lực
      .map((i) => {
        const coord = extractLatLngFromIssueLocation(i);
        return coord ? { issue: i, coord } : null;
      })
      .filter((x): x is { issue: PublicVehicleIssue; coord: LatLng } => !!x)
      .filter((x) => !issueCoords || distanceKm(issueCoords, x.coord) > 0.01);
  }, [issues, issueCoords]);


  // Tập điểm để fit bounds (chỉ gồm layer đang bật)
  const otherPoints: LatLng[] = useMemo(() => {
    return [
      ...(showNearestShops ? topShops.map((x) => x.coord) : []),
      ...(showNearestMobiles ? topMobiles.map((x) => x.coord) : []),
      ...openIssuePoints.map((x) => x.coord),
    ];
  }, [showNearestShops, showNearestMobiles, topShops, topMobiles, openIssuePoints]);

  if (!issueCoords && openIssuePoints.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">{t('no_location_data')}</div>
      </div>
    );
  }

  // Icon pulse cho các sự cố
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
            // 3) Trong Popup của marker “các sự cố mở”, hiển thị theo status hiệu lực
            {openIssuePoints.map(({ issue, coord }) => {
              const eff = getEffectiveStatus(issue);
              return (
                <Marker
                  key={`open-${issue.id}-${coord.lat}-${coord.lng}`}
                  position={[coord.lat, coord.lng]}
                  icon={pulseIcon}
                >
                  <Popup>
                    <div className="text-sm">
                      <div className="font-semibold">
                        {issue.customerName} — <span className="capitalize">{t(`status.${eff}`)}</span>
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
              );
            })}


            {/* 🟦 Cửa hàng gần nhất */}
            {showNearestShops &&
              topShops.map(({ p, coord, d }) => (
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
                      {p.location?.address && <div className="text-xs mt-1">{p.location.address}</div>}
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

            {/* 🟩 KTV lưu động gần nhất */}
            {showNearestMobiles &&
              topMobiles.map(({ p, coord, d }) => (
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
                      {p.location?.address && <div className="text-xs mt-1">{p.location.address}</div>}
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

        {showNearestShops && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#2563eb' }} />
            {t('legend.nearest_shop')}
          </div>
        )}
        {showNearestMobiles && (
          <div className="flex items-center gap-2">
            <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#00d289' }} />
            {t('legend.nearest_mobile')}
          </div>
        )}
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
