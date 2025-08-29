// @/src/components/map/NearbySupportMap/utils/fit.tsx
import * as React from 'react';

function useMap() {
  // lazy import để SSR-safe
  const m = require('react-leaflet');
  return m.useMap() as ReturnType<typeof m.useMap>;
}

type LatLng = { lat: number; lng: number };

function isFiniteLatLng(p: any): p is LatLng {
  const la = Number(p?.lat);
  const ln = Number(p?.lng);
  return Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
}

function dedupePoints(points: LatLng[], eps = 1e-5): LatLng[] {
  const out: LatLng[] = [];
  for (const p of points) {
    if (!out.some(q => Math.abs(q.lat - p.lat) < eps && Math.abs(q.lng - p.lng) < eps)) {
      out.push(p);
    }
  }
  return out;
}

export function FitToMarkers({
  center,
  others,
  padding = 40,
  maxZoom = 18,
}: {
  center?: LatLng;
  others: LatLng[];
  padding?: number;
  maxZoom?: number;
}) {
  const map = useMap();

  // 🔑 deps ổn định (không thay đổi kích thước mảng deps)
  const depsKey = React.useMemo(() => {
    const pts = [
      ...(others || []),
      ...(center ? [center] : []),
    ]
      .filter(isFiniteLatLng)
      // bo tròn để tránh đổi key vì những nhiễu rất nhỏ
      .map(p => `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`)
      .join('|');
    return pts; // luôn là 1 string
  }, [center?.lat, center?.lng, others]);

  React.useEffect(() => {
    const L = require('leaflet');

    // parse lại từ depsKey để tương thích với mọi nguồn
    const pts: LatLng[] = depsKey
      ? depsKey.split('|').filter(Boolean).map(s => {
          const [la, ln] = s.split(',').map(Number);
          return { lat: la, lng: ln };
        })
      : [];

    if (!pts.length) return;

    const uniq = dedupePoints(pts);

    const size = map.getSize?.();
    if (!size || size.x <= 0 || size.y <= 0) {
      // container chưa có size → đợi 1 frame & invalidate
      requestAnimationFrame(() => {
        try { map.invalidateSize?.(); } catch {}
      });
      return;
    }

    const lats = uniq.map(p => p.lat);
    const lngs = uniq.map(p => p.lng);
    const sw = L.latLng(Math.min(...lats), Math.min(...lngs));
    const ne = L.latLng(Math.max(...lats), Math.max(...lngs));
    const bounds = L.latLngBounds(sw, ne);

    const hasArea =
      bounds.getSouth() !== bounds.getNorth() ||
      bounds.getWest()  !== bounds.getEast();

    try {
      if (hasArea && uniq.length >= 2) {
        map.fitBounds(bounds, { padding: [padding, padding], maxZoom });
      } else {
        // chỉ 1 điểm / bounds phẳng → setView với zoom an toàn
        const cur = Number.isFinite(+map.getZoom?.()) ? +map.getZoom() : 13;
        const targetZoom = Math.max(3, Math.min(cur || 13, maxZoom));
        map.setView(bounds.getCenter(), targetZoom);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[FitToMarkers] failed', {
        uniqCount: uniq.length,
        bounds,
        size,
        curZoom: map.getZoom?.(),
        err,
      });
    }
  }, [depsKey, padding, maxZoom, map]);

  return null;
}

export function InvalidateOnToggle({ dep }: { dep: any }) {
  const map = useMap();
  React.useEffect(() => {
    const id = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [dep, map]);
  return null;
}

export function InvalidateOnMount() {
  const m = require('react-leaflet');
  const map = m.useMap();
  React.useEffect(() => {
    const id = setTimeout(() => {
      try { map.invalidateSize(); } catch {}
    }, 0);
    return () => clearTimeout(id);
  }, [map]);
  return null;
}
