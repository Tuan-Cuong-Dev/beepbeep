'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import {
  collection,
  onSnapshot,
  query,
  where,
  GeoPoint,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';
import type { User } from '@/src/lib/users/userTypes';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useTranslation } from 'react-i18next';

// ===== SSR-safe react-leaflet =====
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then((m) => m.CircleMarker), { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false });
const useMap = () => {
  const m = require('react-leaflet');
  return m.useMap() as ReturnType<typeof m.useMap>;
};

// ===== Types =====
interface LatLng { lat: number; lng: number }

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
  // GeoPoint instance
  if (loc.geo instanceof GeoPoint) {
    // @ts-ignore
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }
  // Plain object with latitude/longitude
  // @ts-ignore
  if (typeof loc.geo?.latitude === 'number' && typeof loc.geo?.longitude === 'number') {
    // @ts-ignore
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }
  const parsed = parseLatLngString((loc as any).location);
  return parsed ?? null;
}

/** PublicVehicleIssue.location có thể theo chuẩn LocationCore-like */
function extractLatLngFromIssueLocation(issue: PublicVehicleIssue): LatLng | null {
  const loc: any = issue.location;
  if (loc) {
    if (typeof loc?.geo?.latitude === 'number' && typeof loc?.geo?.longitude === 'number') {
      return { lat: loc.geo.latitude, lng: loc.geo.longitude };
    }
    const fromStr = parseLatLngString(loc.location || loc.coordinates || loc.mapAddress);
    if (fromStr) return fromStr;
  }
  if (issue?.location?.coordinates) {
    const c = (issue.location as any).coordinates;
    if (typeof c?.lat === 'number' && typeof c?.lng === 'number') return { lat: c.lat, lng: c.lng };
    const fromStr = parseLatLngString(typeof c === 'string' ? c : undefined);
    if (fromStr) return fromStr;
  }
  return null;
}

/** Chuẩn hoá Location-like → LocationCore (bắt buộc có geo: GeoPoint nếu có thể) */
function toLocationCore(loc: any): LocationCore | null {
  if (!loc) return null;
  // GeoPoint instance
  if (loc.geo instanceof GeoPoint) return loc as LocationCore;
  // Plain { geo: { latitude, longitude } }
  if (loc.geo && typeof loc.geo.latitude === 'number' && typeof loc.geo.longitude === 'number') {
    return {
      geo: new GeoPoint(loc.geo.latitude, loc.geo.longitude),
      location: typeof loc.location === 'string' ? loc.location : `${loc.geo.latitude},${loc.geo.longitude}`,
      mapAddress: (loc as any).mapAddress,
      address: (loc as any).address,
      updatedAt: (loc as any).updatedAt,
    } as any;
  }
  // Fallback from string
  if (typeof (loc as any).location === 'string') {
    const parsed = parseLatLngString((loc as any).location);
    if (parsed) {
      return {
        geo: new GeoPoint(parsed.lat, parsed.lng),
        location: `${parsed.lat},${parsed.lng}`,
        mapAddress: (loc as any).mapAddress,
        address: (loc as any).address,
        updatedAt: (loc as any).updatedAt,
      } as any;
    }
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

// ===== Constants =====
const OPEN_STATUSES: PublicIssueStatus[] = [
  'pending',
  'assigned',
  'proposed',
  'confirmed',
  'rejected',
  'in_progress',
];

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

const roleColor: Record<string, string> = {
  admin: '#0ea5e9',
  company_owner: '#8b5cf6',
  company_admin: '#6366f1',
  station_manager: '#f59e0b',
  technician: '#059669',
  technician_partner: '#00d289',
  customer: '#111827',
  investor: '#22c55e',
  agent: '#ef4444',
  // default
  default: '#111827',
};

// ===== Page =====
export default function AdminLiveMapPage() {
  const { t } = useTranslation('common');
  const [isClient, setIsClient] = useState(false);

  // Layers toggles
  const [showUsers, setShowUsers] = useState(true);
  const [showTechShops, setShowTechShops] = useState(true);
  const [showTechMobiles, setShowTechMobiles] = useState(true);
  const [showOpenIssues, setShowOpenIssues] = useState(true);

  // Data
  const [users, setUsers] = useState<User[]>([]);
  const [partners, setPartners] = useState<TechnicianPartner[]>([]);
  const [issues, setIssues] = useState<PublicVehicleIssue[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => setIsClient(true), []);

  // ===== Realtime subscriptions =====
  useEffect(() => {
    setLoading(true);

    // Users (mọi role) – lấy những user có lastKnownLocation
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const arr: User[] = [];
      snap.forEach((d) => {
        const u = d.data() as User;
        if (!u.lastKnownLocation) return; // skip if no location at all
        arr.push(u);
      });
      setUsers(arr);
    });

    // Technician Partners – shops & mobiles
    const qPartners = query(collection(db, 'technicianPartners'));
    const unsubPartners = onSnapshot(qPartners, (snap) => {
      const arr: TechnicianPartner[] = [];
      snap.forEach((d) => {
        const tp = { id: d.id, ...d.data() } as TechnicianPartner;
        arr.push(tp);
      });
      setPartners(arr);
    });

    // Public Issues – chỉ trạng thái mở
    const qIssues = query(collection(db, 'publicVehicleIssues'), where('status', 'in', OPEN_STATUSES));
    const unsubIssues = onSnapshot(qIssues, (snap) => {
      const arr: PublicVehicleIssue[] = [];
      snap.forEach((d) => {
        arr.push({ id: d.id, ...(d.data() as any) } as PublicVehicleIssue);
      });
      setIssues(arr);
    });

    const timeout = setTimeout(() => setLoading(false), 600);
    return () => {
      unsubUsers();
      unsubPartners();
      unsubIssues();
      clearTimeout(timeout);
    };
  }, []);

  // ===== Derivations =====
  const techShops = useMemo(() => partners.filter((p) => p.type === 'shop' && (p as any).isActive !== false), [partners]);
  const techMobiles = useMemo(() => partners.filter((p) => p.type === 'mobile' && (p as any).isActive !== false), [partners]);

  const usersWithCoords = useMemo(() => {
    return users
      .map((u) => ({ u, coord: extractLatLngFromLocationCore(toLocationCore((u as any).lastKnownLocation) || ((u as any).lastKnownLocation as any)) }))
      .filter((x): x is { u: User; coord: LatLng } => !!x.coord);
  }, [users]);

  const shopsWithCoords = useMemo(() => {
    return techShops
      .map((p) => ({ p, coord: extractLatLngFromLocationCore((p as any).location) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord);
  }, [techShops]);

  const mobilesWithCoords = useMemo(() => {
    return techMobiles
      .map((p) => ({ p, coord: extractLatLngFromLocationCore((p as any).location) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord);
  }, [techMobiles]);

  const openIssuePoints = useMemo(() => {
    return issues
      .filter((i) => OPEN_STATUSES.includes(i.status))
      .map((i) => ({ issue: i, coord: extractLatLngFromIssueLocation(i) }))
      .filter((x): x is { issue: PublicVehicleIssue; coord: LatLng } => !!x.coord);
  }, [issues]);

  const allVisiblePoints: LatLng[] = useMemo(() => {
    return [
      ...(showUsers ? usersWithCoords.map((x) => x.coord) : []),
      ...(showTechShops ? shopsWithCoords.map((x) => x.coord) : []),
      ...(showTechMobiles ? mobilesWithCoords.map((x) => x.coord) : []),
      ...(showOpenIssues ? openIssuePoints.map((x) => x.coord) : []),
    ];
  }, [showUsers, showTechShops, showTechMobiles, showOpenIssues, usersWithCoords, shopsWithCoords, mobilesWithCoords, openIssuePoints]);

  // Initial center: Việt Nam (Đà Nẵng) fallback
  const defaultCenter: LatLng = { lat: 16.047079, lng: 108.20623 };

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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-grow p-4 md:p-6 space-y-4">
        {/* Page header + toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold">
              {t('admin_dashboard.live_map.title')}
            </h1>
            <p className="text-sm text-gray-600">
              {t('admin_dashboard.live_map.description')}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-3 shadow-sm">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={showUsers} onChange={(e) => setShowUsers(e.target.checked)} />
              <span>{t('admin_dashboard.live_map.toggles.users')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={showTechShops} onChange={(e) => setShowTechShops(e.target.checked)} />
              <span>{t('admin_dashboard.live_map.toggles.tech_shops')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={showTechMobiles} onChange={(e) => setShowTechMobiles(e.target.checked)} />
              <span>{t('admin_dashboard.live_map.toggles.tech_mobiles')}</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" checked={showOpenIssues} onChange={(e) => setShowOpenIssues(e.target.checked)} />
              <span>{t('admin_dashboard.live_map.toggles.open_issues')}</span>
            </label>
            {loading && <span className="text-xs text-gray-500">{t('loading')}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">{t('admin_dashboard.live_map.stats.users_with_location')}</div>
            <div className="mt-1 text-2xl font-semibold">{usersWithCoords.length}</div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">{t('admin_dashboard.live_map.stats.tech_shops')}</div>
            <div className="mt-1 text-2xl font-semibold">{shopsWithCoords.length}</div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">{t('admin_dashboard.live_map.stats.tech_mobiles')}</div>
            <div className="mt-1 text-2xl font-semibold">{mobilesWithCoords.length}</div>
          </div>
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">{t('admin_dashboard.live_map.stats.open_issues')}</div>
            <div className="mt-1 text-2xl font-semibold">{openIssuePoints.length}</div>
          </div>
        </div>

        {/* Map */}
        <div className="rounded-xl border bg-white">
          <div className="flex items-center justify-between p-3">
            <div className="font-semibold">{t('admin_dashboard.live_map.map.title')}</div>
            <div className="text-xs text-gray-500">{t('admin_dashboard.live_map.map.hint_click')}</div>
          </div>
          <div className="h-[560px] w-full">
            {isClient && (
              <MapContainer
                center={allVisiblePoints[0] || defaultCenter}
                zoom={12}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                <FitToMarkers others={allVisiblePoints} />

                {/* Users */}
                {showUsers &&
                  usersWithCoords.map(({ u, coord }) => (
                    <CircleMarker
                      key={`u-${(u as any).uid}-${coord.lat}-${coord.lng}`}
                      center={[coord.lat, coord.lng]}
                      radius={6}
                      pathOptions={{ color: roleColor[(u as any).role] || roleColor.default, weight: 2, fillOpacity: 0.6 }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold">{(u as any).name || (u as any).email}</div>
                          <div className="text-xs text-gray-600">
                            {t('labels.role')}: {(u as any).role || 'unknown'}
                          </div>
                          {(u as any).phone && (
                            <div className="text-xs mt-1">
                              {t('labels.phone')}: <a className="underline" href={`tel:${(u as any).phone}`}>{(u as any).phone}</a>
                            </div>
                          )}
                          {(u as any).lastKnownLocation?.address && (
                            <div className="text-xs mt-1">{(u as any).lastKnownLocation.address}</div>
                          )}
                          <div className="mt-1 font-mono text-[11px]">
                            {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                          </div>
                          <a
                            className="text-blue-600 underline text-xs mt-1 inline-block"
                            href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('actions.open_in_google_maps')}
                          </a>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}

                {/* Technician Shops */}
                {showTechShops &&
                  shopsWithCoords.map(({ p, coord }) => (
                    <CircleMarker
                      key={`shop-${(p as any).id}-${coord.lat}-${coord.lng}`}
                      center={[coord.lat, coord.lng]}
                      radius={8}
                      pathOptions={{ color: '#2563eb', weight: 2, fillOpacity: 0.5 }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold">{(p as any).shopName || (p as any).name || t('admin_dashboard.live_map.labels.tech_shop')}</div>
                          {(p as any).phone && (
                            <div className="text-xs mt-1">
                              {t('labels.phone')}: <a className="underline" href={`tel:${(p as any).phone}`}>{(p as any).phone}</a>
                            </div>
                          )}
                          {(p as any).location?.address && <div className="text-xs mt-1">{(p as any).location.address}</div>}
                          <div className="mt-1 font-mono text-[11px]">
                            {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                          </div>
                          <a
                            className="text-blue-600 underline text-xs mt-1 inline-block"
                            href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('actions.open_in_google_maps')}
                          </a>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}

                {/* Technician Mobiles */}
                {showTechMobiles &&
                  mobilesWithCoords.map(({ p, coord }) => (
                    <CircleMarker
                      key={`mobile-${(p as any).id}-${coord.lat}-${coord.lng}`}
                      center={[coord.lat, coord.lng]}
                      radius={8}
                      pathOptions={{ color: '#00d289', weight: 2, fillOpacity: 0.5 }}
                    >
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold">{(p as any).name || t('admin_dashboard.live_map.labels.tech_mobile')}</div>
                          {(p as any).phone && (
                            <div className="text-xs mt-1">
                              {t('labels.phone')}: <a className="underline" href={`tel:${(p as any).phone}`}>{(p as any).phone}</a>
                            </div>
                          )}
                          {(p as any).location?.address && <div className="text-xs mt-1">{(p as any).location.address}</div>}
                          <div className="mt-1 font-mono text-[11px]">
                            {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                          </div>
                          <a
                            className="text-blue-600 underline text-xs mt-1 inline-block"
                            href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('actions.open_in_google_maps')}
                          </a>
                        </div>
                      </Popup>
                    </CircleMarker>
                  ))}

                {/* Open Issues */}
                {showOpenIssues &&
                  openIssuePoints.map(({ issue, coord }) => (
                    <Marker key={`open-${(issue as any).id}-${coord.lat}-${coord.lng}`} position={[coord.lat, coord.lng]} icon={pulseIcon as any}>
                      <Popup>
                        <div className="text-sm">
                          <div className="font-semibold">
                            {((issue as any).customerName || t('admin_dashboard.live_map.labels.issue'))}
                            {' — '}
                            <span className="capitalize">{t(`status.${(issue as any).status}`)}</span>
                          </div>
                          {(issue as any).phone && (
                            <div className="text-xs text-gray-600">{t('labels.phone')}: {(issue as any).phone}</div>
                          )}
                          {(issue as any).location?.issueAddress && (
                            <div className="text-xs mt-1">{(issue as any).location.issueAddress}</div>
                          )}
                          <div className="mt-1 font-mono text-[11px]">
                            {coord.lat.toFixed(6)}, {coord.lng.toFixed(6)}
                          </div>
                          <a
                            className="text-blue-600 underline text-xs mt-1 inline-block"
                            href={`https://www.google.com/maps/search/?api=1&query=${coord.lat},${coord.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('actions.open_in_google_maps')}
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
              </MapContainer>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 p-3 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#2563eb' }} />
              {t('admin_dashboard.live_map.legend.tech_shop')}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#00d289' }} />
              {t('admin_dashboard.live_map.legend.tech_mobile')}
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: '#111827' }} />
              {t('admin_dashboard.live_map.legend.user')}
            </div>
            {(['pending','assigned','proposed','confirmed','rejected','in_progress'] as PublicIssueStatus[]).map((st) => (
              <div className="flex items-center gap-2" key={st}>
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: statusColor[st] }} />
                {t(`status.${st}`)}
              </div>
            ))}
          </div>

          {/* CSS pulse cho marker sự cố */}
          <style jsx global>{`
            .pulse-marker { position: relative; }
            .pulse-marker .pulse-dot {
              position: relative; display: block; width: 16px; height: 16px; border-radius: 9999px;
              background: #f59e0b; /* proposed color */
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

        {/* Hints / Notes */}
        <div className="text-xs text-gray-500">
          <ul className="list-disc pl-5 space-y-1">
            <li>{t('admin_dashboard.live_map.hints.realtime')}</li>
            <li>{t('admin_dashboard.live_map.hints.optimize')}</li>
            <li>{t('admin_dashboard.live_map.hints.colors')}</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}
