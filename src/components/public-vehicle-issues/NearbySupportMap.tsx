'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import type { LocationCore } from '@/src/lib/locations/locationTypes';

import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useTechnicianPresence, useTrackPolyline } from '@/src/hooks/useLiveTechnicians';

// helpers
import {
  toNum, isValidLatLng, sanitizeLatLng,
  extractLatLngFromLocationCore, extractLatLngFromIssueLocation,
  distanceKm, getEffectiveStatus,
} from '@/src/components/map/NearbySupportMap/utils/geo';
import { FitToMarkers, InvalidateOnMount, InvalidateOnToggle } from '@/src/components/map/NearbySupportMap/utils/fit';
import { useContainerReady } from '@/src/components/map/NearbySupportMap/hooks/useContainerReady';
import { DEFAULT_CENTER, DEFAULT_ZOOM, STATUS_COLOR as statusColor } from '@/src/components/map/NearbySupportMap/utils/constants';

// layers
import { FocusIssueLayer } from '@/src/components/map/NearbySupportMap/layers/FocusIssueLayer';
import { OpenIssuesLayer } from '@/src/components/map/NearbySupportMap/layers/OpenIssuesLayer';
import { ShopsLayer } from '@/src/components/map/NearbySupportMap/layers/ShopsLayer';
import { MobilesLayer } from '@/src/components/map/NearbySupportMap/layers/MobilesLayer';
import { TrackPolylineLayer } from '@/src/components/map/NearbySupportMap/layers/TrackPolylineLayer';
import { Legend } from '@/src/components/map/NearbySupportMap/layers/Legend';

// react-leaflet (SSR-safe)
const MapContainer  = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false });
const CircleMarker  = dynamic(() => import('react-leaflet').then(m => m.CircleMarker),  { ssr: false });
const Circle        = dynamic(() => import('react-leaflet').then(m => m.Circle),        { ssr: false });
const Polyline      = dynamic(() => import('react-leaflet').then(m => m.Polyline),      { ssr: false });

// Avatar kỹ thuật viên lưu động
const DEFAULT_MOBILE_AVATAR = '/assets/images/techinicianPartner_mobile.png';

// types
type LatLng = { lat: number; lng: number };
type LiveStatus = 'online' | 'paused' | 'offline';

type PresenceItem = {
  techId: string;
  name?: string | null;
  companyName?: string | null;
  avatarUrl?: string | null;
  lat: number;
  lng: number;
  accuracy?: number | null;
  updatedAt?: number | null;
  sessionId?: string | null;
  status?: LiveStatus;
  role?: string | null;
};

export interface NearbySupportMapProps {
  issueCoords?: LatLng | null;
  issues?: PublicVehicleIssue[];
  limitPerType?: number;
  showNearestShops?: boolean;
  showNearestMobiles?: boolean;
  renderFocusMarker?: boolean;
  restrictToTechId?: string | null;
}

/** ✅ PublicIssueStatus[] */
const OPEN_STATUSES: PublicIssueStatus[] = [
  'pending','assigned','proposed','confirmed','in_progress',
];

/** ép center thành số hữu hạn, nếu fail -> null */
function toFiniteCenter(c?: {lat:any; lng:any} | null): [number, number] | null {
  if (!c) return null;
  const la = Number(c.lat), ln = Number(c.lng);
  if (Number.isFinite(la) && Number.isFinite(ln)) return [la, ln];
  return null;
}

export default function NearbySupportMap({
  issueCoords,
  issues = [],
  limitPerType = 5,
  showNearestShops = true,
  showNearestMobiles = true,
  renderFocusMarker = true,
  restrictToTechId = null,
}: NearbySupportMapProps) {
  const { t } = useTranslation('common', { keyPrefix: 'map' });

  // client flag
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);

  // fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);
  const toggleFullscreen = useCallback(() => setIsFullscreen(v => !v), []);
  useEffect(() => {
    if (!isClient) return;
    const html = document.documentElement;
    const body = document.body;
    if (isFullscreen) {
      const prevHtml = html.style.overflow, prevBody = body.style.overflow;
      html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
      return () => { html.style.overflow = prevHtml; body.style.overflow = prevBody; };
    }
  }, [isFullscreen, isClient]);
  useEffect(() => {
    if (!isClient) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isClient]);

  // presence realtime
  const rawPresence = (useTechnicianPresence() || []) as any[];
  const normalizePresenceItem = (p: any): PresenceItem | null => {
    const lat = toNum(p.lat ?? p.latitude);
    const lng = toNum(p.lng ?? p.longitude);
    if (!isValidLatLng(lat, lng)) return null;
    return {
      techId: p.techId || p.uid || p.id || '',
      name: p.name ?? null,
      companyName: p.companyName ?? null,
      avatarUrl: (p.avatarUrl ?? p.photoURL ?? DEFAULT_MOBILE_AVATAR),
      lat, lng,
      accuracy: typeof p.accuracy === 'number' ? p.accuracy : (toNum(p.accuracy) || null),
      updatedAt: typeof p.updatedAt === 'number' ? p.updatedAt : (typeof p.ts === 'number' ? p.ts : null),
      sessionId: p.sessionId ?? null,
      status: (p.status as LiveStatus) || 'online',
      role: p.role ?? null,
    };
  };

  // 1) Chuẩn hoá presence
  const liveMobilesBase = useMemo(
    () => (rawPresence || []).map(normalizePresenceItem).filter(Boolean) as PresenceItem[],
    [rawPresence]
  );

  // 2) Nếu có restrictToTechId -> chỉ giữ đúng KTV đó
  const liveMobiles = useMemo(() => {
    if (restrictToTechId) {
      return liveMobilesBase.filter(p => p.techId === restrictToTechId);
    }
    return liveMobilesBase;
  }, [liveMobilesBase, restrictToTechId]);

  // shops collection
  const [shops, setShops] = useState<TechnicianPartner[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);
  useEffect(() => {
    if (!showNearestShops) return;
    let mounted = true;
    async function loadShops(): Promise<TechnicianPartner[]> {
      const shopsQ = query(
        collection(db, 'technicianPartners'),
        where('isActive','==',true),
        where('type','==','shop')
      );
      const shopsSnap = await getDocs(shopsQ);
      return shopsSnap.docs.map(d => ({ id: d.id, ...d.data() } as TechnicianPartner));
    }
    (async () => {
      setLoadingShops(true);
      try { const res = await loadShops(); if (mounted) setShops(res); }
      finally { if (mounted) setLoadingShops(false); }
    })();
    return () => { mounted = false; };
  }, [showNearestShops]);

  // normalized issue coords
  const safeIssue = useMemo(() => sanitizeLatLng(issueCoords || undefined), [issueCoords]);

  // top shops/mobiles around issue
  const topShops = useMemo(() => {
    if (!safeIssue || !showNearestShops) return [] as { p: TechnicianPartner; coord: LatLng; d: number }[];
    return shops
      .map((p) => ({ p, coord: extractLatLngFromLocationCore(p.location as LocationCore | undefined) }))
      .filter((x): x is { p: TechnicianPartner; coord: LatLng } => !!x.coord)
      .map((x) => ({ ...x, d: distanceKm(safeIssue, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [shops, safeIssue, limitPerType, showNearestShops]);

  const topMobiles = useMemo(() => {
    if (!safeIssue || !showNearestMobiles) return [] as { p: PresenceItem; coord: LatLng; d: number }[];
    return liveMobiles
      .map((p) => ({ p, coord: { lat: p.lat, lng: p.lng } }))
      .map((x) => ({ ...x, d: distanceKm(safeIssue, x.coord) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, limitPerType);
  }, [liveMobiles, safeIssue, limitPerType, showNearestMobiles]);

  // open issues layer
  const openIssuePoints = useMemo(() => {
    return (issues || [])
      .filter((i) => OPEN_STATUSES.includes(getEffectiveStatus(i)))
      .map((i) => ({ issue: i, coord: extractLatLngFromIssueLocation(i) }))
      .filter((x): x is { issue: PublicVehicleIssue; coord: LatLng } => !!x.coord)
      .filter((x) => !safeIssue || distanceKm(safeIssue, x.coord) > 0.01);
  }, [issues, safeIssue]);

  // other points for fit bounds
  const otherPoints: LatLng[] = useMemo(() => [
    ...(showNearestShops   ? topShops.map((x) => x.coord)   : []),
    ...(showNearestMobiles ? topMobiles.map((x) => x.coord) : []),
    ...openIssuePoints.map((x) => x.coord),
  ], [showNearestShops, showNearestMobiles, topShops, topMobiles, openIssuePoints]);

  // pulse icon
  const [isClientReady, setIsClientReady] = useState(false);
  useEffect(() => { if (isClient) setIsClientReady(true); }, [isClient]);
  const pulseIcon = useMemo(() => {
    if (!isClientReady) return null;
    const L = require('leaflet');
    return L.divIcon({
      className: 'pulse-marker',
      html: '<span class="pulse-dot"></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }, [isClientReady]);

  // track polyline
  const [selected, setSelected] = useState<{ techId: string; sessionId?: string | null } | null>(null);
  const [showTrack, setShowTrack] = useState(false);
  const rawPoly = useTrackPolyline(selected?.techId || '', selected?.sessionId || undefined);
  const poly = useMemo(
    () => (rawPoly || [])
      .map((pt: any) => sanitizeLatLng({ lat: pt?.lat ?? pt?.latitude, lng: pt?.lng ?? pt?.longitude }))
      .filter(Boolean) as LatLng[],
    [rawPoly]
  );

  const now = Date.now();

  // issue focus (nearest to safeIssue)
  const focusedIssue = useMemo<PublicVehicleIssue | null>(() => {
    if (!safeIssue || !issues?.length) return null;
    let best: { issue: PublicVehicleIssue; d: number } | null = null;
    for (const it of issues) {
      const c = extractLatLngFromIssueLocation(it);
      if (!c) continue;
      const d = distanceKm(safeIssue, c);
      if (!best || d < best.d) best = { issue: it, d };
    }
    return best?.issue ?? null;
  }, [safeIssue, issues]);

  const nearestMobileKm = (showNearestMobiles && topMobiles.length) ? topMobiles[0].d : null;

  // center cho MapContainer (fallback về DEFAULT_CENTER nếu dữ liệu thiếu)
  const centerCandidate = useMemo(() => {
    if (safeIssue) return safeIssue;
    if (openIssuePoints?.length) return openIssuePoints[0].coord;
    return { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
  }, [safeIssue, openIssuePoints]);

  const mapCenter: [number, number] = useMemo(
    () => toFiniteCenter(centerCandidate) ?? DEFAULT_CENTER,
    [centerCandidate]
  );

  const SAFE_CENTER: [number, number] = [Number(mapCenter[0]), Number(mapCenter[1])];
  const SAFE_ZOOM = Number.isFinite(+DEFAULT_ZOOM) ? +DEFAULT_ZOOM : 13;

  const { containerRef, containerOk } = useContainerReady();
  const hasValidCenter = Number.isFinite(SAFE_CENTER[0]) && Number.isFinite(SAFE_CENTER[1]);
  const [mapReady, setMapReady] = useState(false);

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center justify-between p-3">
        <div className="font-semibold">{t('title')}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={isFullscreen ? t('exit_fullscreen') : t('enter_fullscreen')}
            onClick={toggleFullscreen}
            className="inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 active:scale-[.98]"
          >
            {isFullscreen ? t('shrink') : t('expand')}
          </button>
          {loadingShops && <div className="text-xs text-gray-500">{t('loading_partners')}</div>}
        </div>
      </div>

      <div
        ref={containerRef}
        className={isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : 'relative h-[460px] w-full'}
        style={isFullscreen ? {
          paddingTop: 'env(safe-area-inset-top)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        } : undefined}
      >
        {isFullscreen && (
          <button
            type="button"
            onClick={() => setIsFullscreen(false)}
            className="absolute right-3 top-3 z-[10000] rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur hover:bg-black/80 active:scale-[.98]"
          >
            {t('exit_fullscreen')}
          </button>
        )}

        {isClient && containerOk && hasValidCenter && (
          <MapContainer
            center={SAFE_CENTER}
            zoom={SAFE_ZOOM}
            minZoom={3}
            maxZoom={19}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom
            whenReady={() => setMapReady(true)}
          >
            {mapReady && <InvalidateOnMount />}
            {mapReady && <InvalidateOnToggle dep={isFullscreen} />}

            {mapReady && (
              <>
                <TileLayer
                  url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                <FitToMarkers
                  center={{ lat: SAFE_CENTER[0], lng: SAFE_CENTER[1] }}
                  others={otherPoints}
                />

                {/* Focus issue */}
                {renderFocusMarker && safeIssue && (
                  <FocusIssueLayer
                    Marker={Marker}
                    Popup={Popup}
                    pulseIcon={pulseIcon}
                    safeIssue={safeIssue}
                    nearestMobileKm={nearestMobileKm}
                    focusedIssue={focusedIssue}
                    t={t}
                  />
                )}

                {/* Open issues */}
                <OpenIssuesLayer
                  Marker={Marker}
                  Popup={Popup}
                  pulseIcon={pulseIcon}
                  openIssuePoints={openIssuePoints}
                  showNearestMobiles={showNearestMobiles}
                  liveMobiles={liveMobiles}
                  t={t}
                />

                {/* Shops */}
                <ShopsLayer
                  CircleMarker={CircleMarker}
                  Popup={Popup}
                  showNearestShops={showNearestShops}
                  topShops={topShops}
                  t={t}
                />

                {/* Mobiles */}
                <MobilesLayer
                  Circle={Circle}
                  Marker={Marker}
                  Popup={Popup}
                  showNearestMobiles={showNearestMobiles}
                  topMobiles={topMobiles}
                  now={now}
                  selected={selected}
                  setSelected={setSelected}
                  showTrack={showTrack}
                  setShowTrack={setShowTrack}
                  t={t}
                />

                {/* Track polyline */}
                <TrackPolylineLayer
                  Polyline={Polyline}
                  showTrack={showTrack}
                  poly={poly}
                />
              </>
            )}
          </MapContainer>
        )}

        {(!containerOk || !hasValidCenter) && (
          <div className="absolute inset-0 grid place-items-center text-sm text-gray-600">
            {t('loading_partners')}
          </div>
        )}
      </div>

      <Legend isFullscreen={isFullscreen} t={t} statusColor={statusColor} />

      {/* CSS pulse */}
      <style jsx global>{`
        .pulse-marker { position: relative; }
        .pulse-marker .pulse-dot {
          position: relative; display: block; width: 32px; height: 32px; border-radius: 9999px;
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
