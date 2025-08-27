'use client';

import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { useMemo, useState } from 'react';
import { useTechnicianPresence, useTrackPolyline } from '@/src/hooks/useLiveTechnicians';
import { useTranslation } from 'react-i18next';
import { divIcon, type PointExpression } from 'leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer     = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker        = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Polyline      = dynamic(() => import('react-leaflet').then(m => m.Polyline), { ssr: false });
const Popup         = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

type LiveStatus = 'online' | 'paused' | 'offline';
type PresenceItem = {
  techId: string;
  name?: string | null;
  companyName?: string | null;
  avatarUrl?: string | null;   // từ presence
  photoURL?: string | null;    // fallback từ users (nếu hook có kèm)
  lat: number;
  lng: number;
  sessionId?: string | null;
  status?: LiveStatus;
};

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

function avatarDivIcon(params: { url?: string | null; name?: string | null; status?: LiveStatus }) {
  const { url, name, status } = params;
  const ring = statusColor(status);
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

export default function TechnicianLiveMap() {
  const { t } = useTranslation('common');
  const itemsRaw = useTechnicianPresence() as PresenceItem[];
  const [selected, setSelected] = useState<{ techId: string; sessionId?: string | null } | null>(null);
  const poly = useTrackPolyline(selected?.techId || '', selected?.sessionId || undefined);

  // Ưu tiên avatarUrl từ presence, fallback sang photoURL từ users
  const items = useMemo(
    () =>
      (itemsRaw || []).map((it) => ({
        ...it,
        avatarUrl: it.avatarUrl ?? it.photoURL ?? null,
      })),
    [itemsRaw]
  );

  const center = useMemo<[number, number]>(() => {
    if (items.length) return [items[0].lat, items[0].lng];
    return [16.0471, 108.206]; // fallback: Đà Nẵng
  }, [items]);

  return (
    <div className="h-[70vh] rounded overflow-hidden border">
      <div className="p-2 text-sm text-gray-600">{t('admin_live_map_page.map.hint_click')}</div>
      <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {items.map((it) => {
          const icon = avatarDivIcon({ url: it.avatarUrl, name: it.name, status: it.status });
          return (
            <Marker
              key={it.techId}
              position={[it.lat, it.lng]}
              icon={icon}
              eventHandlers={{
                click: () => setSelected({ techId: it.techId, sessionId: it.sessionId || undefined }),
              }}
            >
              <Popup>
                <div className="space-y-1 text-sm">
                  <div className="font-semibold">{it.name || it.techId}</div>
                  <div>{t('admin_live_map_page.popup.company')}: {it.companyName || '-'}</div>
                  <div>{t('admin_live_map_page.popup.status')}: {it.status || 'offline'}</div>
                  <div>{t('admin_live_map_page.popup.session')}: {it.sessionId || '-'}</div>
                  <button
                    className="mt-2 px-2 py-1 text-xs rounded bg-black text-white"
                    onClick={() => setSelected({ techId: it.techId, sessionId: it.sessionId || undefined })}
                  >
                    {t('admin_live_map_page.popup.view_path')}
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {!!poly.length && (
          <Polyline positions={poly.map((p) => [p.lat, p.lng] as [number, number])} />
        )}
      </MapContainer>
    </div>
  );
}
