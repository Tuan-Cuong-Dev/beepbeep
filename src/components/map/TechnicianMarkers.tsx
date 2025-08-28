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
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
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

export default function TechnicianMarkers({ vehicleType }: Props) {
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

  // Optional filter theo vehicleType (client-side)
  const visibleTechs = useMemo(() => {
    const base = technicians.filter((t) => !!extractLatLngFromPartner(t));
    if (!vehicleType) return base;
    return base.filter(
      (t) => t.vehicleType === vehicleType || (!t.vehicleType && vehicleType === 'motorbike')
    );
  }, [technicians, vehicleType]);

  return (
    <>
      {visibleTechs.map((tech) => {
        const coord = extractLatLngFromPartner(tech);
        if (!coord) return null;

        return (
          <Marker key={tech.id ?? `${coord[0]}-${coord[1]}`} position={coord} icon={technicianIcon}>
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
