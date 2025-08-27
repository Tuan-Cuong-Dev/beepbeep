'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';
import type { User } from '@/src/lib/users/userTypes';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where, GeoPoint } from 'firebase/firestore';
import { useTechnicianPresence, useTrackPolyline } from '@/src/hooks/useLiveTechnicians';

// React-Leaflet (SSR-safe)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),  { ssr: false });
const Circle        = dynamic(() => import('react-leaflet').then(m => m.Circle),        { ssr: false });
const Polyline      = dynamic(() => import('react-leaflet').then(m => m.Polyline),      { ssr: false });

/* ---------------------------------------------------
 * Types & helpers
 * --------------------------------------------------- */
type LatLng = { lat: number; lng: number };
type LiveStatus = 'online' | 'paused' | 'offline';

type PresenceItem = {
  techId: string;
  name?: string | null;
  companyName?: string | null;
  avatarUrl?: string | null;
  lat: number;
  lng: number;
  accuracy?: number | null;   // meters
  updatedAt?: number | null;  // millis
  sessionId?: string | null;
  status?: LiveStatus;
  role?: string | null;       // kỳ vọng 'technician_partner'
};

interface NearbySupportMapProps {
  issueCoords?: LatLng | null;
  issues?: PublicVehicleIssue[];
  limitPerType?: number;
  /** Bật/tắt lớp “Cửa hàng gần nhất” (shop) */
  showNearestShops?: boolean;
  /** Bật/tắt lớp “KTV lưu động gần nhất” (mobile) — lấy realtime từ presence */
  showNearestMobiles?: boolean;
}

/** Các trạng thái “mở” */
const OPEN_STATUSES: PublicIssueStatus[] = [
  'pending',
  'assigned',
  'proposed',
  'confirmed',
  'rejected',
  'in_progress',
];

/** Màu trạng thái (legend) */
const statusColor: Record<PublicIssueStatus, string> = {
  pending:    '#ef4444',
  assigned:   '#fb923c',
  proposed:   '#f59e0b',
  confirmed:  '#10b981',
  rejected:   '#f43f5e',
  in_progress:'#6366f1',
  resolved:   '#9333ea',
  closed:     '#6b7280',
};

/** Nếu issue đang proposed nhưng đã bị reject bởi assistant → coi là 'rejected' */
function getEffectiveStatus(i: PublicVehicleIssue): PublicIssueStatus {
  if (i.status === 'proposed' && i.approveStatus === 'rejected') return 'rejected';
  return i.status;
}

function parseLatLngString(s?: string): LatLng | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** LocationCore → LatLng (ưu tiên geo; fallback string "lat,lng") */
function extractLatLngFromLocationCore(loc?: LocationCore | null): LatLng | null {
  if (!loc) return null;
  if (typeof loc.geo?.latitude === 'number' && typeof loc.geo?.longitude === 'number') {
    return { lat: loc.geo.latitude, lng: loc.geo.longitude };
  }
  return parseLatLngString(loc.location) ?? null;
}

/** PublicVehicleIssue.location có thể flexible */
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

/** Chuẩn hoá location-like thành LocationCore (có GeoPoint) */
function toLocationCore(loc: any): LocationCore | null {
  if (!loc) return null;
  if (loc.geo instanceof GeoPoint) return loc as LocationCore;
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

/* ---------------------------------------------------
 * Small map utilities
 * --------------------------------------------------- */
function useLeafletMap() {
  // lazy import để tránh SSR lỗi
  const m = require('react-leaflet');
  return m.useMap() as ReturnType<typeof m.useMap>;
}

function FitToMarkers({ center, others }: { center?: LatLng; others: LatLng[] }) {
  const map = useLeafletMap();
  useEffect(() => {
    const pts = [...others];
    if (center) pts.push(center);
    if (!pts.length) return;
    const lats = pts.map((p) => p.lat);
    const lngs = pts.map((p) => p.lng);
    const southWest = [Math.min(...lats), Math.min(...lngs)] as [number, number];
    const northEast = [Math.max(...lats), Math.max(...lngs)] as [number, number];
    map.fitBounds([southWest, northEast], { padding: [40, 40] });
  }, [center?.lat, center?.lng, others.map((p) => `${p.lat},${p.lng}`).join('|')]); // serialize deps
  return null;
}

/* ---------------------------------------------------
 * Main component
 * --------------------------------------------------- */
export default function NearbySupportMap({
  issueCoords,
  issues = [],
  limitPerType = 5,
  showNearestShops = true,
  showNearestMobiles = true,
}: NearbySupportMapProps) {
  const { t } = useTranslation('common', { keyPrefix: 'map' });

  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  /* 1) Realtime KTV lưu động từ presence */
  const presence = (useTechnicianPresence() || []) as any[];

  /** Chuẩn hoá item presence để chắc chắn có lat/lng */
  function normalizePresenceItem(p: any): PresenceItem | null {
    const lat = Number.isFinite(p.lat) ? p.lat : Number.isFinite(p.latitude) ? p.latitude : NaN;
    const lng = Number.isFinite(p.lng) ? p.lng : Number.isFinite(p.longitude) ? p.longitude : NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

    return {
      techId: p.techId || p.uid || p.id || '',
      name: p.name ?? null,
      companyName: p.companyName ?? null,
      avatarUrl: p.avatarUrl ?? p.photoURL ?? null,
      lat,
      lng,
      accuracy: typeof p.accuracy === 'number' ? p.accuracy : null,
      updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : (typeof p.ts === 'number' ? p.ts : null),
      sessionId: p.sessionId ?? null,
      status: (p.status as LiveStatus) || 'online',
      role: p.role ?? null,
    };
  }

  const liveMobiles = useMemo(() => {
    const out = (presence || []).map(normalizePresenceItem).filter(Boolean) as PresenceItem[];
    // ⚠️ Không filter theo role để khỏi loại nhầm
    return out;
  }, [presence]);


  /* 2) Optional: load “Cửa hàng” (shop) từ collection */
  const [shops, setShops] = useState<TechnicianPartner[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);

  useEffect(() => {
    if (!showNearestShops) return;
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

    (async () => {
      setLoadingShops(true);
      try {
        const res = await loadShops();
        if (mounted) setShops(res);
      } catch (e) {
        console.error('Load shops failed', e);
      } finally {
        if (mounted) setLoadingShops(false);
      }
    })();

    return () => { mounted = false; };
  }, [showNearestShops]);

  /* 3) Tính top N quanh issue */
  const topShops = useMemo(() => {
    if (!issueCoords || !showNearestShops) return [];
    return shops
      .map((p) => ({ p, coord: extractLatLngFromLocationCore(p.location) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord)
      .map((x) => ({ ...x, d: distanceKm(issueCoords, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [shops, issueCoords, limitPerType, showNearestShops]);

  const topMobiles = useMemo(() => {
    if (!issueCoords || !showNearestMobiles) return [];
    return liveMobiles
      .map((p) => ({ p, coord: { lat: p.lat, lng: p.lng } }))
      .map((x) => ({ ...x, d: distanceKm(issueCoords, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [liveMobiles, issueCoords, limitPerType, showNearestMobiles]);

  /* 4) Các sự cố “mở” */
  const openIssuePoints = useMemo(() => {
    return (issues || [])
      .filter((i) => OPEN_STATUSES.includes(getEffectiveStatus(i)))
      .map((i) => {
        const coord = extractLatLngFromIssueLocation(i);
        return coord ? { issue: i, coord } : null;
      })
      .filter((x): x is { issue: PublicVehicleIssue; coord: LatLng } => !!x)
      .filter((x) => !issueCoords || distanceKm(issueCoords, x.coord) > 0.01);
  }, [issues, issueCoords]);

  /* 5) Fit bounds points */
  const otherPoints: LatLng[] = useMemo(() => {
    return [
      ...(showNearestShops   ? topShops.map((x) => x.coord)   : []),
      ...(showNearestMobiles ? topMobiles.map((x) => x.coord) : []),
      ...openIssuePoints.map((x) => x.coord),
    ];
  }, [showNearestShops, showNearestMobiles, topShops, topMobiles, openIssuePoints]);

  /* 6) Pulse icon (client-only) */
    const pulseIcon = useMemo(() => {
    if (!isClient) return null;
    const L = require('leaflet');
    return L.divIcon({
      className: 'pulse-marker',
      html: '<span class="pulse-dot"></span>',
      iconSize: [24, 24],   // đồng bộ 24px
      iconAnchor: [12, 12],
    });
  }, [isClient]);


  /* 7) Theo dõi đường đi KTV (khi cần) */
  const [selected, setSelected] = useState<{ techId: string; sessionId?: string | null } | null>(null);
  const [showTrack, setShowTrack] = useState(false);
  const poly = useTrackPolyline(selected?.techId || '', selected?.sessionId || undefined);

  const now = Date.now();

  /* 8) UI */
  if (!issueCoords && openIssuePoints.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-gray-600">{t('no_location_data')}</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-3">
        <div className="font-semibold">{t('title')}</div>
        {loadingShops && <div className="text-xs text-gray-500">{t('loading_partners')}</div>}
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

            <FitToMarkers
              center={issueCoords || undefined}
              others={otherPoints}
            />

            {/* Sự cố đang xem (pulse) */}
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

            {/* Các sự cố “mở” (pulse) */}
            {openIssuePoints.map(({ issue, coord }) => {
              const eff = getEffectiveStatus(issue);
              return (
                <Marker
                  key={`open-${issue.id}-${coord.lat}-${coord.lng}`}
                  position={[coord.lat, coord.lng]}
                  icon={pulseIcon!}
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

            {/* Cửa hàng gần nhất (shop) */}
            {showNearestShops &&
              topShops.map(({ p, coord, d }) => (
                <CircleMarker
                  key={`shop-${p.id}`}
                  center={[coord.lat, coord.lng]}
                  radius={12}   // đồng bộ 24px đường kính
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

            {/* KTV lưu động gần nhất (realtime presence) */}
            {showNearestMobiles &&
              topMobiles.map(({ p, coord, d }) => {
                // p là PresenceItem ở đây; reuse kiểu hiển thị “avatar vòng trạng thái”
                // vẽ accuracy nếu có
                const acc = typeof p.accuracy === 'number' ? Math.min(p.accuracy, 120) : null;

                // tạo divIcon avatar
                const { divIcon } = require('leaflet');
                const ring = '#10B981'; // màu viền tuỳ status
                const html = `
                  <div style="
                    position: relative;
                    width: 24px; height: 24px;
                    border-radius: 9999px;
                    box-shadow: 0 1px 4px rgba(0,0,0,.25);
                    outline: 2px solid ${ring};
                    background: white;
                    display: grid; place-items: center;
                    overflow: hidden;
                  ">
                    ${p.avatarUrl
                      ? `<img src="${p.avatarUrl}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover"/>`
                      : `<div style="width:100%;height:100%;display:grid;place-items:center;font-weight:600;font-size:12px;color:#374151;background:#E5E7EB;">
                          ${(p.name || p.techId || 'KTV').slice(0,2).toUpperCase()}
                        </div>`
                    }
                    <div style="
                      position:absolute; right:-2px; bottom:-2px;
                      width: 10px; height: 10px; border-radius:9999px;
                      background: ${ring}; border:2px solid white;
                    "></div>
                  </div>`;

                const avatarIcon = divIcon({
                  html,
                  className: 'tech-avatar-marker',
                  iconSize: [32, 32],   // 👈 chỉnh lại size
                  iconAnchor: [16, 16], // 👈 tâm icon
                  popupAnchor: [0, -20],
                });


                return (
                  <React.Fragment key={`mobile-${p.techId}-${coord.lat}-${coord.lng}`}>
                    {acc ? (
                      <Circle
                        center={[coord.lat, coord.lng]}
                        radius={acc}
                        pathOptions={{ color: '#93C5FD', fillColor: '#DBEAFE', fillOpacity: 0.3, weight: 1 }}
                      />
                    ) : null}

                    <Marker position={[coord.lat, coord.lng]} icon={avatarIcon}
                      eventHandlers={{
                        click: () => {
                          // chọn để xem track
                          setSelected({ techId: p.techId, sessionId: p.sessionId || undefined });
                          setShowTrack(true);
                        },
                      }}
                    >
                      <Popup>
                        <div className="space-y-2 text-[13px] leading-5 text-gray-700 select-none">
                          <div className="text-base font-semibold text-gray-900">
                            {p.name || p.techId}
                          </div>

                          <div className="flex items-start gap-2">
                            <span className="min-w-[72px] text-gray-500">{t('popup.company')}:</span>
                            <span className="font-medium text-gray-800">{p.companyName || '—'}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="min-w-[72px] text-gray-500">{t('popup.status')}:</span>
                            {(() => {
                              const st = (p.status || 'offline') as LiveStatus;
                              const cls =
                                st === 'online'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : st === 'paused'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-gray-200 text-gray-700';
                              const label =
                                st === 'online' ? t('status.online')
                                : st === 'paused' ? t('status.paused')
                                : t('status.offline');
                              return (
                                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
                                  {label}
                                </span>
                              );
                            })()}
                            {p.updatedAt && (
                              <span className="text-[11px] text-gray-500">
                                • {t('updated')} {Math.max(1, Math.round((now - (p.updatedAt||0)) / 1000))}s
                              </span>
                            )}
                          </div>

                          <div className="text-xs mt-1">
                            {t('distance_km', { val: d.toFixed(2) })}
                          </div>

                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              className="px-3 py-1.5 text-xs rounded-lg bg-gray-900 text-white hover:bg-gray-800 active:scale-[.98] select-none"
                              onClick={() => {
                                setSelected({ techId: p.techId, sessionId: p.sessionId || undefined });
                                setShowTrack(prev => {
                                  // nếu đang chọn cùng tech/session thì toggle, còn lại bật
                                  if (selected?.techId === p.techId && (selected?.sessionId||undefined) === (p.sessionId||undefined)) {
                                    return !prev;
                                  }
                                  return true;
                                });
                              }}
                            >
                              {showTrack &&
                               selected?.techId === p.techId &&
                               (selected?.sessionId||undefined) === (p.sessionId||undefined)
                                ? t('popup.hide_path')
                                : t('popup.view_path')}
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  </React.Fragment>
                );
              })}

            {/* Đường đi của KTV đang chọn (mờ→đậm theo thời gian) */}
            {showTrack && poly.length > 1 && (
              <>
                {Array.from({ length: poly.length - 1 }).map((_, i) => {
                  const opacity = 0.2 + 0.8 * ((i + 1) / poly.length);
                  return (
                    <Polyline
                      key={`seg-${i + 1}`}
                      positions={[
                        [poly[i].lat, poly[i].lng],
                        [poly[i + 1].lat, poly[i + 1].lng],
                      ]}
                      pathOptions={{ color: '#111827', weight: 3, opacity }}
                    />
                  );
                })}
              </>
            )}
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
