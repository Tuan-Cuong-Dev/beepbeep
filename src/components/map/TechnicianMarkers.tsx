'use client';

import { useEffect, useMemo, useState } from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useTranslation } from 'react-i18next';

interface Props {
  vehicleType?: 'car' | 'motorbike' | 'bike'; // optional filter
  /** ✅ Namespace để đảm bảo key duy nhất tuyệt đối giữa các layer */
  keyPrefix?: string;
}

const technicianIcon = L.icon({
  iconUrl: '/assets/images/technician.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// ===== Helpers =====
function parseLatLngString(s?: string): [number, number] | null {
  if (!s) return null;
  const m = s.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lat, lng] : null;
}

/** Lấy toạ độ từ LocationCore (ưu tiên chuẩn mới), có fallback cho legacy */
function extractLatLngFromPartner(p: TechnicianPartner): [number, number] | null {
  const loc: any = p.location;

  if (loc?.geo && typeof loc.geo.latitude === 'number' && typeof loc.geo.longitude === 'number') {
    return [loc.geo.latitude, loc.geo.longitude];
  }
  if (typeof loc?.location === 'string') {
    const parsed = parseLatLngString(loc.location);
    if (parsed) return parsed;
  }
  if (typeof loc?.lat === 'number' && typeof loc?.lng === 'number') {
    if (Number.isFinite(loc.lat) && Number.isFinite(loc.lng)) return [loc.lat, loc.lng];
  }
  if (typeof loc?.coordinates === 'string') {
    const parsed = parseLatLngString(loc.coordinates);
    if (parsed) return parsed;
  }
  const legacyCoords = (p as any)?.coordinates;
  if (legacyCoords && typeof legacyCoords.lat === 'number' && typeof legacyCoords.lng === 'number') {
    if (Number.isFinite(legacyCoords.lat) && Number.isFinite(legacyCoords.lng)) {
      return [legacyCoords.lat, legacyCoords.lng];
    }
  }
  return null;
}

/** ✅ Khử trùng lặp theo id (phòng trường hợp gộp nhiều nguồn sau này) */
function uniqById<T extends { id?: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const x of arr) {
    if (!x?.id) continue;
    if (!seen.has(x.id)) {
      seen.add(x.id);
      out.push(x);
    }
  }
  return out;
}

export default function TechnicianMarkers({
  vehicleType,
  keyPrefix = 'tech',
}: Props) {
  const [technicians, setTechnicians] = useState<TechnicianPartner[]>([]);
  const { t } = useTranslation('common');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const baseQ = query(collection(db, 'technicianPartners'), where('isActive', '==', true));
        const snap = await getDocs(baseQ);
        const data = snap.docs.map((d) => ({ id: d.id, ...(d.data() as TechnicianPartner) }));
        if (!mounted) return;
        setTechnicians(data);
      } catch (err) {
        console.error('Error fetching technician partners:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ✅ Chuẩn hoá danh sách: có tọa độ hợp lệ + filter theo vehicleType + uniq
  const visibleTechs = useMemo(() => {
    const withCoords = (technicians || []).filter((t) => !!extractLatLngFromPartner(t));
    const typed = !vehicleType
      ? withCoords
      : withCoords.filter(
          (t) => t.vehicleType === vehicleType || (!t.vehicleType && vehicleType === 'motorbike')
        );
    return uniqById(typed);
  }, [technicians, vehicleType]);

  return (
    <>
      {visibleTechs.map((tech) => {
        const coord = extractLatLngFromPartner(tech);
        if (!coord) return null;

        return (
          <Marker
            key={`${keyPrefix}:${tech.id ?? `${coord[0]}-${coord[1]}`}`} // ✅ key có namespace
            position={coord}
            icon={technicianIcon}
          >
            <Popup>
              <div className="text-sm leading-snug max-w-[220px]">
                <p className="font-semibold">{tech.name}</p>
                <p className="text-xs text-gray-700">
                  {tech.type === 'shop'
                    ? t('technician_markers.shop')
                    : t('technician_markers.mobile')}
                </p>
                <p className="text-xs text-gray-600">
                  📍 {tech.location?.address || t('technician_markers.no_address')}
                </p>
                {tech.phone && (
                  <p className="text-xs text-gray-600">
                    📞{' '}
                    <a className="underline" href={`tel:${tech.phone}`}>
                      {tech.phone}
                    </a>
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
