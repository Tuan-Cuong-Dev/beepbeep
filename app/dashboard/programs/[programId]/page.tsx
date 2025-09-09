'use client';

import { useEffect, useMemo, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { useParams } from 'next/navigation';
import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';

import { getDistance } from 'geolib';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/src/utils/formatCurrency';

import type { Program, ProgramModelDiscount } from '@/src/lib/programs/rental-programs/programsType';

/* -------------------- utils -------------------- */

// chunk for Firestore `in` (max 10)
const chunk = <T,>(arr: T[], size = 10): T[][] =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );

// tolerant geo parsing (GeoPoint | plain | string "lat,lng" | nested geo)
function toLatLng(input: any): { latitude: number; longitude: number } | null {
  if (!input) return null;
  if (typeof input === 'object' && 'geo' in input) return toLatLng((input as any).geo);

  if (typeof input === 'object') {
    const lat =
      typeof (input as any).latitude === 'number'
        ? (input as any).latitude
        : typeof (input as any)._lat === 'number'
        ? (input as any)._lat
        : typeof (input as any).lat === 'number'
        ? (input as any).lat
        : undefined;

    const lng =
      typeof (input as any).longitude === 'number'
        ? (input as any).longitude
        : typeof (input as any)._long === 'number'
        ? (input as any)._long
        : typeof (input as any).lng === 'number'
        ? (input as any).lng
        : typeof (input as any).lon === 'number'
        ? (input as any).lon
        : undefined;

    if (typeof lat === 'number' && typeof lng === 'number') return { latitude: lat, longitude: lng };
  }

  if (typeof input === 'string') {
    const m = input.trim().match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[3]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) return { latitude: lat, longitude: lng };
    }
  }
  return null;
}
const getEntityLatLng = (entity: any) =>
  toLatLng(entity?.location?.geo) ||
  toLatLng(entity?.location) ||
  toLatLng(entity?.geo) ||
  toLatLng(entity);

/** Chuẩn hoá định dạng giảm giá cũ → mảng ProgramModelDiscount[] */
function normalizeModelDiscounts(raw: any): ProgramModelDiscount[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((x) => x && typeof x.modelId === 'string')
      .map((x) => ({
        modelId: x.modelId,
        discountType: x.discountType === 'percentage' ? 'percentage' : 'fixed',
        discountValue:
          typeof x.discountValue === 'number'
            ? x.discountValue
            : Number(x.discountValue) || 0,
      }));
  }
  if (raw && typeof raw === 'object') {
    return Object.entries(raw)
      .map(([modelId, v]: [string, any]) => {
        if (v == null) return null;
        if (typeof v === 'number') {
          return { modelId, discountType: 'fixed' as const, discountValue: v };
        }
        if (typeof v === 'object') {
          const discountType = v.discountType === 'percentage' ? 'percentage' : 'fixed';
          const discountValue =
            typeof v.discountValue === 'number'
              ? v.discountValue
              : Number(v.discountValue) || 0;
          return { modelId, discountType, discountValue };
        }
        return null;
      })
      .filter(Boolean) as ProgramModelDiscount[];
  }
  return [];
}

function safeDateStr(ts?: Timestamp | null): string {
  try {
    const d: Date | undefined = ts?.toDate?.();
    return d ? d.toLocaleDateString() : '-';
  } catch {
    return '-';
  }
}

/* -------------------- component -------------------- */

type Company = { id: string; name?: string; email?: string; location?: any };

export default function ProgramDetailPage() {
  const { t } = useTranslation('common');
  const { user, role } = useUser() as any; // ✅ dùng hook bên trong component
  const params = useParams();
  const programId = params?.programId as string;

  const normalizedRole = (role || '').toLowerCase();
  const isAgent = normalizedRole === 'agent';

  const [program, setProgram] = useState<Program | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [modelNames, setModelNames] = useState<Record<string, string>>({});
  const [agent, setAgent] = useState<any>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const nowMs = Timestamp.now().toMillis();

  const statusBadge = useMemo(() => {
    if (!program) return null;
    if (!program.isActive) return <Badge variant="secondary">{t('programs_page.status.inactive')}</Badge>;
    const startMs = program.startDate?.toMillis?.();
    const endMs = program.endDate?.toMillis?.();
    if (startMs && startMs > nowMs) return <Badge variant="warning">{t('programs_page.status.upcoming')}</Badge>;
    if (endMs && endMs < nowMs) return <Badge variant="destructive">{t('programs_page.status.ended')}</Badge>;
    return <Badge variant="brand">{t('programs_page.status.active')}</Badge>;
  }, [program, nowMs, t]);

  const renderDistance = (station: any) => {
    const agentLoc = getEntityLatLng(agent);
    const stationLoc = getEntityLatLng(station);
    if (!agentLoc || !stationLoc) return null;
    const distance = getDistance(agentLoc, stationLoc);
    return `${(distance / 1000).toFixed(1)} km`;
  };

  useEffect(() => {
    if (!programId || !user) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // 1) Program
        const programSnap = await getDoc(doc(db, 'programs', programId));
        if (!programSnap.exists()) {
          if (mounted) setError('Program not found');
          return;
        }
        const raw = { id: programSnap.id, ...programSnap.data() } as any;
        const normalizedDiscounts = normalizeModelDiscounts(raw.modelDiscounts);
        const p = { ...raw, modelDiscounts: normalizedDiscounts } as Program;
        if (!mounted) return;
        setProgram(p);

        const tasks: Promise<any>[] = [];

        // 2) Company (if any)
        if (p.companyId) {
          tasks.push(
            getDoc(doc(db, 'rentalCompanies', p.companyId)).then((cSnap) => {
              if (mounted && cSnap.exists()) {
                setCompany({ id: cSnap.id, ...(cSnap.data() as any) });
              }
            })
          );
        } else {
          setCompany(null);
        }

        // 3) Model names
        tasks.push(
          (async () => {
            const discounts = (p.modelDiscounts ?? []) as ProgramModelDiscount[];
            const modelIds = Array.from(new Set(discounts.map((d) => d.modelId)));
            const names: Record<string, string> = {};

            if (modelIds.length > 0) {
              for (const ids of chunk(modelIds, 10)) {
                const snap = await getDocs(
                  query(collection(db, 'vehicleModels'), where(documentId(), 'in', ids)),
                );
                snap.forEach((d) => {
                  const data = d.data() as any;
                  if (data?.name) names[d.id] = data.name;
                });
              }
            } else if (p.companyId) {
              const msnap = await getDocs(
                query(collection(db, 'vehicleModels'), where('companyId', '==', p.companyId)),
              );
              msnap.forEach((d) => {
                const data = d.data() as any;
                if (data?.name) names[d.id] = data.name;
              });
            }
            if (mounted) setModelNames(names);
          })()
        );

        // 4) Stations
        tasks.push(
          (async () => {
            if (p.companyId) {
              const targets = (p.stationTargets ?? []) as { stationId: string }[];
              if (targets.length > 0) {
                const ids = targets.map((s) => s.stationId);
                const loaded: any[] = [];
                for (const group of chunk(ids, 10)) {
                  const ssnap = await getDocs(
                    query(collection(db, 'rentalStations'), where(documentId(), 'in', group)),
                  );
                  ssnap.forEach((d) => loaded.push({ id: d.id, ...(d.data() as any) }));
                }
                if (mounted) setStations(loaded);
              } else {
                const ssnap = await getDocs(
                  query(collection(db, 'rentalStations'), where('companyId', '==', p.companyId)),
                );
                if (mounted) setStations(ssnap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
              }
            } else if (mounted) {
              setStations([]);
            }
          })()
        );

        // 5) Agent profile (for distance)
        tasks.push(
          (async () => {
            const aSnap = await getDocs(
              query(collection(db, 'agents'), where('ownerId', '==', user.uid)),
            );
            if (!aSnap.empty && mounted) setAgent(aSnap.docs[0].data());
          })()
        );

        // 6) Joined? — chỉ cần kiểm tra khi là agent
        if (isAgent) {
          tasks.push(
            (async () => {
              const jSnap = await getDocs(
                query(
                  collection(db, 'programParticipants'),
                  where('programId', '==', programId),
                  where('userId', '==', user.uid),
                ),
              );
              if (!jSnap.empty && mounted) setJoined(true);
            })()
          );
        }

        await Promise.all(tasks);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load program');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
    // ✅ deps phải dùng isAgent lấy từ role trong component
  }, [programId, user, isAgent]);

  const handleJoin = async () => {
    if (!user || joined || !isAgent) return; // chỉ Agent mới được join
    await addDoc(collection(db, 'programParticipants'), {
      programId,
      userId: user.uid,
      userRole: 'agent',
      status: 'joined',
      joinedAt: serverTimestamp(),
    });
    setJoined(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 px-6 py-10 max-w-3xl mx-auto">
          <div className="text-gray-600">{t('loading', 'Đang tải dữ liệu…')}</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 px-6 py-10 max-w-3xl mx-auto">
          <div className="text-gray-600">{t('program_detail_page.not_found', 'Không tìm thấy chương trình.')}</div>
        </main>
        <Footer />
      </div>
    );
  }

  const startStr = safeDateStr(program.startDate as any);
  const endStr = safeDateStr(program.endDate as any);
  const descriptionText = (program.description ?? '').toString().trim();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-8 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold">🎯 {program.title}</h1>
          {statusBadge}
        </div>

        <p className="text-gray-600">
          {t('program_detail_page.period', { start: startStr, end: endStr })}
        </p>

        {/* Description */}
        <div className="bg-white border rounded-xl p-4">
          <h3 className="font-semibold mb-2">
            {t('program_detail_page.description_title', 'Mô tả chương trình')}
          </h3>
          {descriptionText ? (
            <p className="text-gray-700 whitespace-pre-line">{descriptionText}</p>
          ) : (
            <p className="text-gray-500 text-sm">
              {t('program_detail_page.no_description', 'Chưa có mô tả.')}
            </p>
          )}
        </div>

        {company && (
          <p className="text-gray-700">
            {t('program_detail_page.company_info', {
              name: company?.name || '—',
              email: company?.email || 'N/A',
            })}
          </p>
        )}

        {/* Discounts by model */}
        {Array.isArray(program.modelDiscounts) && program.modelDiscounts.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold">{t('program_detail_page.discount_models')}</p>
            <ul className="list-disc ml-6">
              {program.modelDiscounts.map((d: ProgramModelDiscount) => {
                const name = modelNames[d.modelId];
                if (!name) return null;
                const value =
                  d.discountType === 'fixed'
                    ? formatCurrency(d.discountValue)
                    : `${d.discountValue}%`;
                return (
                  <li key={d.modelId}>
                    {name}: {value}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Stations */}
        {stations.length > 0 && (
          <div className="space-y-2">
            <p className="font-semibold">{t('program_detail_page.stations_applied')}</p>
            <ul className="list-disc ml-6">
              {stations.map((st) => {
                const dist = renderDistance(st);
                return (
                  <li key={st.id}>
                    {st.name} {dist ? `(${dist})` : ''}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* Join button chỉ hiện cho Agent */}
        <div>
          {isAgent ? (
            joined ? (
              <p className="text-green-600 font-semibold">
                {t('program_detail_page.already_joined')}
              </p>
            ) : (
              <Button onClick={handleJoin}>
                {t('program_detail_page.join_button')}
              </Button>
            )
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  );
}
