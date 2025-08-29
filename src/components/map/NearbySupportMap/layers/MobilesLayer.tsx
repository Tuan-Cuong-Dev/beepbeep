import React, { useMemo } from 'react';
import { isValidLatLng } from '../utils/geo';

type LatLng = { lat: number; lng: number };
type LiveStatus = 'online' | 'paused' | 'offline';

type MobileItem = {
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
};

type Props = {
  Circle: any; // react-leaflet Circle (được dynamic import ở ngoài)
  Marker: any; // react-leaflet Marker
  Popup: any;  // react-leaflet Popup
  topMobiles: Array<{ p: MobileItem; coord: LatLng; d: number }>;
  showNearestMobiles: boolean;
  now: number;
  selected: { techId: string; sessionId?: string | null } | null;
  setSelected: (v: { techId: string; sessionId?: string | null }) => void;
  showTrack: boolean;
  setShowTrack: (v: boolean | ((prev: boolean) => boolean)) => void;
  t: (k: string, opts?: Record<string, any>) => string;
};

function buildAvatarIcon(avatarUrl: string | null | undefined, label: string) {
  // lazy require để tránh SSR lỗi
  const { divIcon } = require('leaflet');
  const ring = '#10B981';

  const html = `
    <div style="
      position:relative;width:32px;height:32px;border-radius:9999px;
      box-shadow:0 2px 8px rgba(0,0,0,.25);outline:3px solid ${ring};
      background:white;display:grid;place-items:center;overflow:hidden;
      cursor:pointer;pointer-events:auto;">
      ${avatarUrl
        ? `<img src="${avatarUrl}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover"/>`
        : `<div style="width:100%;height:100%;display:grid;place-items:center;
                     font-weight:600;font-size:16px;color:#374151;background:#E5E7EB;">
             ${label}
           </div>`
      }
      <div style="
        position:absolute;right:-4px;bottom:-4px;width:14px;height:14px;
        border-radius:9999px;background:${ring};border:2px solid white;"></div>
    </div>
  `;

  return divIcon({
    html,
    className: 'tech-avatar-marker',
    iconSize: [48, 48],
    iconAnchor: [24, 24],
    popupAnchor: [0, -24],
  });
}

export function MobilesLayer({
  Circle, Marker, Popup,
  topMobiles, showNearestMobiles,
  now, selected, setSelected, showTrack, setShowTrack,
  t,
}: Props) {
  // Không bật lớp hoặc không có dữ liệu
  const mobiles = useMemo(() => topMobiles || [], [topMobiles]);
  if (!showNearestMobiles || mobiles.length === 0) return null;

  return (
    <>
      {mobiles.map(({ p, coord, d }) => {
        // Bỏ qua toạ độ không hợp lệ để tránh NaN
        if (!isValidLatLng(coord.lat, coord.lng)) return null;

        // Accuracy vòng tròn (giới hạn tối đa 120m)
        const acc =
          typeof p.accuracy === 'number' && Number.isFinite(p.accuracy)
            ? Math.min(p.accuracy, 120)
            : null;

        // Nhãn fallback cho avatar text
        const initials = (p.name || p.techId || 'KTV').slice(0, 2).toUpperCase();

        const avatarIcon = buildAvatarIcon(p.avatarUrl, initials);

        const isSelected =
          selected?.techId === p.techId &&
          (selected?.sessionId || undefined) === (p.sessionId || undefined);

        const onToggleTrack = () => {
          setSelected({ techId: p.techId, sessionId: p.sessionId || undefined });
          setShowTrack(prev => (isSelected ? !prev : true));
        };

        const status: LiveStatus = (p.status || 'offline') as LiveStatus;
        const statusClass =
          status === 'online'
            ? 'bg-emerald-100 text-emerald-700'
            : status === 'paused'
            ? 'bg-amber-100 text-amber-800'
            : 'bg-gray-200 text-gray-700';
        const statusLabel =
          status === 'online'
            ? t('status.online')
            : status === 'paused'
            ? t('status.paused')
            : t('status.offline');

        return (
          <React.Fragment key={`mobile-${p.techId}-${coord.lat}-${coord.lng}`}>
            {acc ? (
              <Circle
                center={[coord.lat, coord.lng]}
                radius={acc}
                interactive={false}
                pathOptions={{ color: '#93C5FD', fillColor: '#DBEAFE', fillOpacity: 0.3, weight: 1 }}
              />
            ) : null}

            <Marker
              position={[coord.lat, coord.lng]}
              icon={avatarIcon}
              zIndexOffset={1000}
              riseOnHover
              eventHandlers={{
                click: onToggleTrack,
                // @ts-ignore - touchstart không có trong type phản hồi react-leaflet
                touchstart: () => {},
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
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                    {p.updatedAt && (
                      <span className="text-[11px] text-gray-500">
                        • {t('updated')} {Math.max(1, Math.round((now - (p.updatedAt || 0)) / 1000))}s
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
                      onClick={onToggleTrack}
                    >
                      {showTrack && isSelected ? t('popup.hide_path') : t('popup.view_path')}
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
}
