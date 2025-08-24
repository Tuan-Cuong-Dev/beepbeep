'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

// ===== Local loose types =====
type GeoLike = { latitude: number; longitude: number };
type LocationCoreLoose = {
  geo?: GeoLike | { latitude: number; longitude: number };
  location?: string; // "lat,lng"
  coordinates?: string | { lat?: number; lng?: number };
  address?: string;
};
type TPDocLoose = {
  id?: string;
  userId?: string;
  ownerId?: string;
  createdBy?: string;
  name?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  type?: string; // 'mobile' | 'shop' | 'technician_partner'
  subtype?: string;
  businessType?: string;
  isActive?: boolean;
  serviceCategories?: string[];
  assignedRegions?: string[];
  averageRating?: number | null;
  ratingCount?: number | null;
  location?: LocationCoreLoose | null;
};

type UserLoose = {
  uid: string;
  name?: string;
  email?: string;
  phone?: string;
  photoURL?: string;
  role?: string; // 'technician_partner'...
  lastKnownLocation?: { updatedAt?: any; geo?: GeoLike } | null;
};

// ===== Display type =====
interface DisplayTechnician {
  userId: string;
  docId: string; // doc id của technicianPartners
  name: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  serviceCategories: string[];
  assignedRegions: string[];
  averageRating?: number | null;
  ratingCount?: number | null;
  distanceKm?: number | null;
  score: number; // dùng để sort
}

interface Props {
  onAssign: (userId: string, name: string) => void | Promise<void>;
  filterCategory?: string;
  filterRegion?: string;
  issueCoords?: { lat: number; lng: number } | null;
}

// ===== Helpers =====
function toRad(x: number) {
  return (x * Math.PI) / 180;
}
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const A =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * c;
}
function parseLatLngString(s?: string): { lat: number; lng: number } | null {
  if (!s || typeof s !== 'string') return null;
  const m = s.match(/^\s*(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)\s*$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[3]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}
function extractLatLngFromLocation(loc?: LocationCoreLoose | null): { lat: number; lng: number } | null {
  if (!loc) return null;
  const g = (loc as any)?.geo;
  if (g && typeof g.latitude === 'number' && typeof g.longitude === 'number') {
    return { lat: g.latitude, lng: g.longitude };
  }
  if (typeof loc.location === 'string') {
    return parseLatLngString(loc.location);
  }
  if (typeof loc.coordinates === 'string') {
    return parseLatLngString(loc.coordinates);
  }
  const c = loc.coordinates as any;
  if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
    return { lat: c.lat, lng: c.lng };
  }
  return null;
}
const isRecent = (d?: any, hours = 24) => {
  if (!d) return false;
  try {
    const t =
      d instanceof Date
        ? d.getTime()
        : typeof d.toDate === 'function'
        ? d.toDate().getTime()
        : new Date(d).getTime();
    return Date.now() - t <= hours * 3600 * 1000;
  } catch {
    return false;
  }
};

// ===== Component =====
export default function AssignTechnicianForm({
  onAssign,
  filterCategory,
  filterRegion,
  issueCoords,
}: Props) {
  const { t } = useTranslation('common');
  const [technicians, setTechnicians] = useState<DisplayTechnician[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchMobileTechs = async () => {
      setLoading(true);
      try {
        const usersQ = query(collection(db, 'users'), where('role', '==', 'technician_partner'));
        const usersSnap = await getDocs(usersQ);
        const users: UserLoose[] = usersSnap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) }));

        const partnersQ = query(collection(db, 'technicianPartners'), where('isActive', '==', true));
        const partnersSnap = await getDocs(partnersQ);

        const rawPartners: (Omit<TPDocLoose, 'id'> & { docId: string })[] = partnersSnap.docs.map(
          (ds) => {
            const { id: _ignored, ...rest } = ds.data() as TPDocLoose;
            return { docId: ds.id, ...rest };
          }
        );

        const mobilePartners = rawPartners.filter((p) => {
          const type = String(p.type ?? '').toLowerCase();
          const subtype = String(p.subtype ?? '').toLowerCase();
          const btype = String(p.businessType ?? '').toLowerCase();
          return type === 'mobile' || subtype === 'mobile' || (type === 'technician_partner' && subtype === 'mobile') || (btype === 'technician_partner' && subtype === 'mobile');
        });

        const partnersByUserId = new Map(
          mobilePartners
            .map((p) => {
              const uid = p.userId || p.ownerId || p.createdBy || '';
              if (!uid) return null;
              return [uid, p] as const;
            })
            .filter(Boolean) as readonly (readonly [string, Omit<TPDocLoose, 'id'> & { docId: string }])[]
        );

        let merged: DisplayTechnician[] = users
          .filter((u) => partnersByUserId.has(u.uid))
          .map((u) => {
            const p = partnersByUserId.get(u.uid)!;
            const coords = extractLatLngFromLocation(p.location || undefined);

            const distanceKm = issueCoords && coords ? haversineKm(issueCoords, coords) : null;

            let score = 0;
            if (filterCategory && (p.serviceCategories ?? []).includes(filterCategory)) score += 2;
            if (filterRegion && (p.assignedRegions ?? []).includes(filterRegion)) score += 1;
            if (isRecent(u.lastKnownLocation?.updatedAt, 24)) score += 1;
            if (distanceKm != null) {
              if (distanceKm <= 5) score += 0.5;
              else if (distanceKm > 15) score -= 0.5;
            }

            return {
              userId: u.uid,
              docId: p.docId,
              name: u.name || p.name || t('assign_technician.unnamed_technician'),
              phone: u.phone || p.phone,
              email: u.email || p.email,
              avatarUrl: p.avatarUrl || u.photoURL || '/assets/images/technician.png',
              serviceCategories: p.serviceCategories ?? [],
              assignedRegions: p.assignedRegions ?? [],
              averageRating: p.averageRating ?? null,
              ratingCount: p.ratingCount ?? null,
              distanceKm,
              score,
            };
          });

        merged = merged.filter((t) => {
          const okCat = filterCategory ? t.serviceCategories.includes(filterCategory) : true;
          const okReg = filterRegion ? t.assignedRegions.includes(filterRegion) : true;
          return okCat && okReg;
        });

        merged.sort((a, b) => {
          const s = b.score - a.score;
          if (s !== 0) return s;
          if (a.distanceKm != null && b.distanceKm != null) {
            const d = a.distanceKm - b.distanceKm;
            if (d !== 0) return d;
          }
          return a.name.localeCompare(b.name);
        });

        if (!mounted) return;
        setTechnicians(merged);

        if (merged.length > 0 && !selectedUserId) {
          setSelectedUserId(merged[0].userId);
        }
      } catch (e) {
        console.error('AssignTechnicianForm fetch error:', e);
        if (!mounted) setTechnicians([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchMobileTechs();
    return () => {
      mounted = false;
    };
  }, [filterCategory, filterRegion, issueCoords, selectedUserId, t]);

  const options = useMemo(
    () =>
      technicians.map((tch) => {
        let label = tch.name;
        if (tch.averageRating != null) {
          label += `  •  ${t('assign_technician.rating_with_count', {
            rating: tch.averageRating.toFixed(1),
            count: tch.ratingCount ?? 0,
          })}`;
        }
        if (typeof tch.distanceKm === 'number') {
          label += `  •  ${t('assign_technician.distance_km', { km: tch.distanceKm.toFixed(1) })}`;
        }
        if (tch.score > 0) {
          label += `  •  ${t('assign_technician.score', { score: tch.score })}`;
        }
        return { value: tch.userId, label };
      }),
    [technicians, t]
  );

  const selectedTech = technicians.find((t) => t.userId === selectedUserId);

  const handleAssignClick = async () => {
    if (!selectedUserId || !selectedTech) return;
    await onAssign(selectedUserId, selectedTech.name);
  };

  return (
    <div className="space-y-4">
      <SimpleSelect
        options={options}
        placeholder={t('assign_technician.select_placeholder')}
        value={selectedUserId}
        onChange={(val: string) => setSelectedUserId(val)}
      />

      {selectedTech && (
        <div className="flex items-start gap-3 rounded-lg border p-3">
          <Image
            src={selectedTech.avatarUrl || '/assets/images/technician.png'}
            alt={selectedTech.name}
            width={44}
            height={44}
            className="rounded-full border"
          />
          <div className="min-w-0">
            <div className="font-semibold">{selectedTech.name}</div>

            <div className="mt-1 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
              {selectedTech.phone && (
                <span>
                  📞 <a className="underline" href={`tel:${selectedTech.phone}`}>{selectedTech.phone}</a>
                </span>
              )}
              {selectedTech.averageRating != null && (
                <span>
                  {t('assign_technician.rating_with_count', {
                    rating: selectedTech.averageRating.toFixed(1),
                    count: selectedTech.ratingCount ?? 0,
                  })}
                </span>
              )}
              {typeof selectedTech.distanceKm === 'number' && (
                <span>
                  {t('assign_technician.distance_km', { km: selectedTech.distanceKm.toFixed(1) })}
                </span>
              )}
            </div>

            {(selectedTech.serviceCategories?.length > 0 || selectedTech.assignedRegions?.length > 0) && (
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                {selectedTech.serviceCategories?.length > 0 && (
                  <div>{t('assign_technician.services')}: {selectedTech.serviceCategories.join(', ')}</div>
                )}
                {selectedTech.assignedRegions?.length > 0 && (
                  <div>{t('assign_technician.regions')}: {selectedTech.assignedRegions.join(', ')}</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Button disabled={loading || !selectedUserId} onClick={handleAssignClick} className="w-full">
        {loading ? t('assign_technician.loading') : t('assign_technician.assign_button')}
      </Button>

      {!loading && technicians.length === 0 && (
        <p className="text-sm text-gray-500">{t('assign_technician.empty_state')}</p>
      )}
    </div>
  );
}
