'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useMemo, useRef, useState, Fragment } from 'react';
import { useTechnicianPresence, useTrackPolyline } from '@/src/hooks/useLiveTechnicians';
import { useTranslation } from 'react-i18next';
import { divIcon, type PointExpression, type LatLngBoundsExpression } from 'leaflet';
import { useMap } from 'react-leaflet';
import { useUser } from '@/src/context/AuthContext';

// React-Leaflet components (tắt SSR để tránh lỗi Next SSR)
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer),     { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker),        { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup),         { ssr: false });
const Polyline      = dynamic(() => import('react-leaflet').then(m => m.Polyline),      { ssr: false });
const Circle        = dynamic(() => import('react-leaflet').then(m => m.Circle),        { ssr: false });

type LiveStatus = 'online' | 'paused' | 'offline';
type PresenceItem = {
  techId: string;
  name?: string | null;
  companyName?: string | null;
  avatarUrl?: string | null;
  lat: number;
  lng: number;
  accuracy?: number | null;   // m
  updatedAt?: number | null;  // millis
  sessionId?: string | null;
  status?: LiveStatus;
};

/* ===== Helpers: initials, colors, avatar marker ===== */
function initials(name?: string | null) {
  if (!name) return 'KTV';
  const parts = name.trim().split(/\s+/);
  const a = parts[0]?.[0] || '';
  const b = parts[parts.length - 1]?.[0] || '';
  return (a + b).toUpperCase();
}
function statusColor(status?: LiveStatus) {
  if (status === 'online') return '#10B981';   // emerald-500
  if (status === 'paused') return '#F59E0B';   // amber-500
  return '#9CA3AF';                            // gray-400
}
function avatarDivIcon(
  params: { url?: string | null; name?: string | null; status?: LiveStatus; isStale?: boolean }
) {
  const { url, name, status, isStale } = params;
  const ring = isStale ? '#D1D5DB' : statusColor(status);
  const fallback = initials(name);
  const hasImg = !!url;

  const html = `
  <div style="
    position: relative;
    width: 48px; height: 48px;
    border-radius: 9999px;
    box-shadow: 0 2px 8px rgba(0,0,0,.25);
    outline: 3px solid ${ring};
    background: white;
    display: grid; place-items: center;
    overflow: hidden;
  ">
    ${hasImg
      ? `<img src="${url}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover"/>`
      : `<div style="width:100%;height:100%;display:grid;place-items:center;font-weight:700;color:#374151;background:#E5E7EB;">${fallback}</div>`
    }
    <div style="
      position:absolute; right:-2px; bottom:-2px;
      width: 18px; height: 18px; border-radius:9999px;
      background: ${ring}; border:2px solid white;
    "></div>
  </div>`;

  return divIcon({
    html,
    className: 'tech-avatar-marker',
    iconSize: [48, 48] as PointExpression,
    iconAnchor: [24, 24],
    popupAnchor: [0, -28],
  });
}

/* ===== Polyline nhạt -> đậm theo thứ tự thời gian ===== */
function SegmentedTrack({ points }: { points: { lat: number; lng: number }[] }) {
  if (points.length < 2) return null;
  const n = points.length;
  return (
    <Fragment>
      {Array.from({ length: n - 1 }).map((_, i) => {
        const opacity = 0.2 + 0.8 * ((i + 1) / n);
        return (
          <Polyline
            key={`seg-${i + 1}`}
            positions={[
              [points[i].lat, points[i].lng],
              [points[i + 1].lat, points[i + 1].lng],
            ]}
            pathOptions={{ color: '#111827', weight: 3, opacity }}
          />
        );
      })}
    </Fragment>
  );
}

/* ===== Helpers to spread overlapping markers (anti-overlap) ===== */
type LatLng = { lat: number; lng: number };

/** Di chuyển ~meters theo hướng bearingDeg (đủ dùng UI) */
function moveByMeters({ lat, lng }: LatLng, meters: number, bearingDeg: number): LatLng {
  const R = 6371000; // m
  const br = (bearingDeg * Math.PI) / 180;
  const dByR = meters / R;
  const lat1 = (lat * Math.PI) / 180;
  const lng1 = (lng * Math.PI) / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) + Math.cos(lat1) * Math.sin(dByR) * Math.cos(br)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(br) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2)
    );

  return { lat: (lat2 * 180) / Math.PI, lng: (lng2 * 180) / Math.PI };
}

/** Trải các điểm có cùng (lat,lng) thành vòng tròn nhỏ xung quanh tâm */
function spreadOverlapping<T extends LatLng>(items: (T & { _id: string })[], radiusM = 10): (T & { _id: string })[] {
  const keyOf = (p: LatLng) => `${p.lat.toFixed(6)}_${p.lng.toFixed(6)}`; // gom cụm độ mịn 1e-6
  const groups = new Map<string, (T & { _id: string })[]>();

  for (const it of items) {
    const k = keyOf(it);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(it);
  }

  const out: (T & { _id: string })[] = [];
  groups.forEach((group) => {
    if (group.length === 1) {
      out.push(group[0]);
    } else {
      const n = group.length;
      for (let i = 0; i < n; i++) {
        const bearing = (360 / n) * i;
        const moved = moveByMeters(group[i], radiusM, bearing);
        out.push({ ...group[i], lat: moved.lat, lng: moved.lng });
      }
    }
  });

  return out;
}

/* ===== Overlay legend + nút reset view (i18n) ===== */
function LegendOverlay({ onReset }: { onReset: () => void }) {
  const { t } = useTranslation('common');
  return (
    <div className="absolute left-2 bottom-2 z-[1000] bg-white/90 backdrop-blur rounded-lg border p-2 text-xs text-gray-700 space-y-1">
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#10B981' }} />
        {t('technician_live_map.legend.online')}
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#F59E0B' }} />
        {t('technician_live_map.legend.paused')}
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full" style={{ background: '#9CA3AF' }} />
        {t('technician_live_map.legend.offline')}
      </div>
      <button onClick={onReset} className="mt-1 w-full rounded bg-gray-900 text-white px-2 py-1">
        {t('technician_live_map.legend.reset_view')}
      </button>
    </div>
  );
}

/* Lấy instance map và đưa về parent qua onReady */
function MapReady({ onReady }: { onReady: (map: any) => void }) {
  const map = useMap();
  useEffect(() => { onReady(map); }, [map, onReady]);
  return null;
}

export default function TechnicianLiveMap() {
  const { t } = useTranslation('common');
  const { role } = useUser();
  const isAdmin = role?.toLowerCase() === 'admin';
  const isAssistant = role?.toLowerCase() === 'technician_assistant';

  const items = useTechnicianPresence() as PresenceItem[];

  // Chuẩn hoá danh sách hiển thị: lọc NaN + gán _id + jitter tránh chồng marker
  const displayItems = useMemo(() => {
    const base =
      (items || [])
        .filter(it => Number.isFinite(it.lat) && Number.isFinite(it.lng))
        .map((it, idx) => ({ ...it, _id: `${it.techId}-${it.sessionId || 'na'}-${idx}` }));

    // (tuỳ chọn) loại (0,0): bật dòng dưới nếu cần
    // const filtered = base.filter(it => !(Math.abs(it.lat) < 1e-6 && Math.abs(it.lng) < 1e-6));

    return spreadOverlapping(base, 10);
  }, [items]);

  const [selected, setSelected] = useState<{ techId: string; sessionId?: string | null } | null>(null);
  const [showTrack, setShowTrack] = useState(false);
  const poly = useTrackPolyline(selected?.techId || '', selected?.sessionId || undefined);

  const mapRef = useRef<any>(null);

  const center = useMemo<[number, number]>(() => {
    if (displayItems.length) return [displayItems[0].lat, displayItems[0].lng];
    return [16.0471, 108.206]; // Đà Nẵng (fallback)
  }, [displayItems]);

  const resetView = () => {
    const map = mapRef.current;
    if (!map || !displayItems.length) return;
    const bounds: LatLngBoundsExpression =
      displayItems.map(i => [i.lat, i.lng]) as unknown as LatLngBoundsExpression;
    map.fitBounds(bounds, { padding: [24, 24] });
  };

  // Khi bật showTrack, auto fit vào đường đi
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !showTrack || poly.length < 2) return;
    const bounds: LatLngBoundsExpression = poly.map(p => [p.lat, p.lng]) as unknown as LatLngBoundsExpression;
    map.fitBounds(bounds, { padding: [32, 32] });
  }, [showTrack, poly]);

  const toggleTrack = (it: PresenceItem) => {
    const same = selected?.techId === it.techId && (selected?.sessionId || undefined) === (it.sessionId || undefined);
    if (same) setShowTrack(prev => !prev);
    else {
      setSelected({ techId: it.techId, sessionId: it.sessionId || undefined });
      setShowTrack(true);
    }
  };

  const now = Date.now();

  return (
    <div className="relative h-[70vh] rounded overflow-hidden border">
      <div className="p-2 text-sm text-gray-600">
        {t('technician_live_map.map.hint')}
      </div>

      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <MapReady onReady={(m) => (mapRef.current = m)} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Accuracy circles */}
        {displayItems.map(it =>
          it.accuracy && it.accuracy > 0 ? (
            <Circle
              key={`${it._id}-acc`}
              center={[it.lat, it.lng]}
              radius={Math.min(it.accuracy, 120)}
              pathOptions={{ color: '#93C5FD', fillColor: '#DBEAFE', fillOpacity: 0.3, weight: 1 }}
            />
          ) : null
        )}

        {/* Markers */}
        {displayItems.map((it) => {
          const last = typeof it.updatedAt === 'number' ? it.updatedAt : null;
          const isStale = last ? now - last > 60_000 : it.status !== 'online';
          const icon = avatarDivIcon({ url: it.avatarUrl, name: it.name, status: it.status, isStale });

          return (
            <Marker
              key={it._id}
              position={[it.lat, it.lng]}
              icon={icon}
              eventHandlers={{ click: () => setSelected({ techId: it.techId, sessionId: it.sessionId || undefined }) }}
            >
              <Popup>
                <div className="space-y-2 text-[13px] leading-5 text-gray-700 select-none">
                  <div className="text-base font-semibold text-gray-900">
                    {it.name || it.techId}
                  </div>

                  <div className="flex items-start gap-2">
                    <span className="min-w-[72px] text-gray-500">{t('technician_live_map.popup.company')}:</span>
                    <span className="font-medium text-gray-800">{it.companyName || '—'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="min-w-[72px] text-gray-500">{t('technician_live_map.popup.status')}:</span>
                    {(() => {
                      const st = it.status || 'offline';
                      const cls =
                        st === 'online'
                          ? 'bg-emerald-100 text-emerald-700'
                          : st === 'paused'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-gray-200 text-gray-700';
                      const label =
                        st === 'online' ? t('technician_live_map.status.online')
                          : st === 'paused' ? t('technician_live_map.status.paused')
                          : t('technician_live_map.status.offline');
                      return (
                        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>
                          {label}
                        </span>
                      );
                    })()}
                    {last && (
                      <span className="text-[11px] text-gray-500">
                        • {t('technician_live_map.common.updated')} {Math.max(1, Math.round((now - last) / 1000))}s
                      </span>
                    )}
                  </div>

                  {/* Chỉ admin/assistant thấy sessionId */}
                  {(isAdmin || isAssistant) && (
                    <div className="flex items-center gap-2">
                      <span className="min-w-[72px] text-gray-500">{t('technician_live_map.popup.session')}:</span>
                      <span className="font-mono text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded select-text">
                        {it.sessionId || '—'}
                      </span>
                      {it.sessionId && (
                        <button
                          className="ml-1 text-xs px-1.5 py-0.5 rounded bg-black text-white hover:bg-gray-800 active:scale-[.98]"
                          onClick={() => navigator.clipboard?.writeText(it.sessionId as string)}
                          type="button"
                        >
                          {t('technician_live_map.common.copy')}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3 py-1.5 text-xs rounded-lg bg-gray-900 text-white hover:bg-gray-800 active:scale-[.98] select-none"
                      onClick={() => setShowTrack(prev => {
                        const same = selected?.techId === it.techId && (selected?.sessionId || undefined) === (it.sessionId || undefined);
                        if (!same) setSelected({ techId: it.techId, sessionId: it.sessionId || undefined });
                        return same ? !prev : true;
                      })}
                    >
                      {showTrack &&
                      selected?.techId === it.techId &&
                      (selected?.sessionId || undefined) === (it.sessionId || undefined)
                        ? t('technician_live_map.popup.hide_path')
                        : t('technician_live_map.popup.view_path')}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Đường đi */}
        {showTrack && poly.length > 1 && <SegmentedTrack points={poly} />}
      </MapContainer>

      {/* Legend + Reset (overlay) */}
      <LegendOverlay onReset={resetView} />
    </div>
  );
}
