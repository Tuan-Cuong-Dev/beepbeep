'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  collection, getDocs, query, where, addDoc, serverTimestamp, doc, deleteDoc, Timestamp, Query, CollectionReference
} from 'firebase/firestore';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'next/navigation';

import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import type { Program } from '@/src/lib/programs/rental-programs/programsType';

const LOG = true;
const log  = (...a: any[]) => LOG && console.log('[ProgramsPage]', ...a);
const warn = (...a: any[]) => LOG && console.warn('[ProgramsPage]', ...a);
const err  = (...a: any[]) => LOG && console.error('[ProgramsPage]', ...a);

const normalizeRole = (r?: string) => (r || '').toLowerCase();
const useRoleFlags = (role?: string) => {
  const r = normalizeRole(role);
  return {
    isAgent: r === 'agent',
    isAdmin: r === 'admin',
    isCompanyCreator: ['company_owner','private_provider','company_admin','station_manager'].includes(r),
  };
};

const normalizeProgram = (raw: any, id: string): Program => ({
  id,
  title: raw.title ?? '',
  description: raw.description ?? '',
  type: raw.type ?? 'rental_program',
  createdByUserId: raw.createdByUserId ?? null,
  createdByRole: raw.createdByRole ?? null,
  companyId: raw.companyId ?? null,
  stationTargets: Array.isArray(raw.stationTargets) ? raw.stationTargets : [],
  modelDiscounts: Array.isArray(raw.modelDiscounts) ? raw.modelDiscounts : raw.modelDiscounts ?? [],
  startDate: raw.startDate instanceof Timestamp ? raw.startDate : null,
  endDate: raw.endDate instanceof Timestamp ? raw.endDate : null,
  isActive: raw.isActive ?? true,
  createdAt: raw.createdAt ?? Timestamp.now(),
  updatedAt: raw.updatedAt ?? Timestamp.now(),
});

/** Đếm mẫu xe: hỗ trợ cả object legacy và array mới */
function getModelCount(modelDiscounts: any): number {
  if (Array.isArray(modelDiscounts)) return modelDiscounts.length;
  if (modelDiscounts && typeof modelDiscounts === 'object') return Object.keys(modelDiscounts).length;
  return 0;
}

type StationCountMap = Record<string, number>; // companyId -> count

/** Đếm trạm hiển thị cho card */
function getStationCount(
  program: Program,
  stationCountByCompany: StationCountMap
): number {
  const t = Array.isArray(program.stationTargets) ? program.stationTargets : [];
  if (t.length > 0) return t.length;
  if (program.companyId) {
    const n = stationCountByCompany[program.companyId];
    return typeof n === 'number' ? n : 0;
  }
  return 0;
}

type ActionsProps = {
  programId: string;
  role?: string;
  joinedPrograms: string[];
  onJoin: (programId: string) => void;
  onDelete: (programId: string) => void;
  t: (k: string, p?: any) => string;
};
function ProgramActions({ programId, role, joinedPrograms, onJoin, onDelete, t }: ActionsProps) {
  const { isAgent, isAdmin, isCompanyCreator } = useRoleFlags(role);
  if (isAgent) {
    const joined = joinedPrograms.includes(programId);
    return (
      <div className="space-y-2">
        {joined ? (
          <div className="text-green-600 font-medium text-sm">✅ {t('programs_page.joined')}</div>
        ) : (
          <Button size="sm" onClick={() => onJoin(programId)}>{t('programs_page.join_button')}</Button>
        )}
      </div>
    );
  }
  if (isCompanyCreator || isAdmin) {
    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href={`/dashboard/programs/${programId}/participants`}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-md text-center transition text-sm"
        >
          {t('programs_page.view_participants')}
        </Link>
        <Button size="sm" variant="destructive" onClick={() => onDelete(programId)}>
          {t('programs_page.delete_button')}
        </Button>
      </div>
    );
  }
  return null;
}

export default function ProgramsPageClient() {
  const { t } = useTranslation('common');
  const { user, role, companyId: ctxCompanyId } = useUser() as any;

  const search = useSearchParams();
  let qpCompanyId: string | null = null;
  let qpStationId: string | null = null;

  if (search) {
    qpCompanyId = search.get('companyId');
    qpStationId = search.get('stationId');
  }


  const [programs, setPrograms] = useState<Program[]>([]);
  const [joinedPrograms, setJoinedPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // NEW: Đếm trạm toàn công ty (áp dụng khi stationTargets rỗng)
  const [stationCountByCompany, setStationCountByCompany] = useState<StationCountMap>({});

  const { isAgent, isAdmin, isCompanyCreator } = useRoleFlags(role);

  const fetchCompanyId = async (uid: string) => {
    const q1 = query(collection(db, 'rentalCompanies'), where('ownerId', '==', uid));
    const s1 = await getDocs(q1);
    if (!s1.empty) return s1.docs[0].id;

    const q2 = query(collection(db, 'privateProviders'), where('ownerId', '==', uid));
    const s2 = await getDocs(q2);
    if (!s2.empty) return s2.docs[0].id;

    return null;
  };

  useEffect(() => {
    if (!user?.uid) return;

    let isMounted = true;
    (async () => {
      setLoading(true);
      setErrMsg(null);
      try {
        log('role/user', { uid: user.uid, role, ctxCompanyId, qpCompanyId, qpStationId });

        const forcedCompanyId = qpCompanyId || null;
        const resolvedCompanyId =
          forcedCompanyId ??
          (isCompanyCreator && !ctxCompanyId ? await fetchCompanyId(user.uid) : ctxCompanyId ?? null);

        let qRef: Query | CollectionReference = collection(db, 'programs');

        if (forcedCompanyId) {
          qRef = query(
            collection(db, 'programs'),
            where('type', '==', 'rental_program'),
            where('companyId', '==', forcedCompanyId)
          );
          log('Query forced by URL', { type: 'rental_program', companyId: forcedCompanyId });
        } else if (isAgent) {
          qRef = query(collection(db, 'programs'), where('type', '==', 'agent_program'));
          log('Query agent default', { type: 'agent_program' });
        } else if (isCompanyCreator) {
          if (!resolvedCompanyId) {
            warn('No companyId resolved for company role; empty result.');
            if (isMounted) setPrograms([]);
            setLoading(false);
            return;
          }
          qRef = query(
            collection(db, 'programs'),
            where('type', '==', 'rental_program'),
            where('companyId', '==', resolvedCompanyId)
          );
          log('Query company role', { type: 'rental_program', companyId: resolvedCompanyId });
        } else if (isAdmin) {
          qRef = collection(db, 'programs');
          log('Query admin: ALL programs');
        } else {
          log('Unknown role → empty list');
          if (isMounted) setPrograms([]);
          setLoading(false);
          return;
        }

        const snap = await getDocs(qRef);
        log('Snapshot size:', snap.size);

        let list = snap.docs.map((d) => normalizeProgram(d.data() as any, d.id));

        if (qpStationId) {
          const before = list.length;
          list = list.filter((p) => {
            const targets = Array.isArray(p.stationTargets) ? p.stationTargets : [];
            return targets.length === 0 || targets.some((t: any) => t?.stationId === qpStationId);
          });
          log(`Filter by stationId=${qpStationId}: ${before} -> ${list.length}`);
        }

        if (isMounted) setPrograms(list);

        // 🔢 Build company station counts (for cards that apply-to-all stations)
        const companyIds = Array.from(
          new Set(
            list
              .filter((p) => !p.stationTargets?.length && p.companyId) // chỉ những program apply toàn bộ trạm
              .map((p) => p.companyId as string)
          )
        );

        if (companyIds.length) {
          const entries: StationCountMap = {};
          // Đếm rentalStations cho từng companyId
          await Promise.all(
            companyIds.map(async (cid) => {
              const stSnap = await getDocs(
                query(collection(db, 'rentalStations'), where('companyId', '==', cid))
              );
              let count = stSnap.size;

              // Fallback nếu là provider không có trạm vật lý → coi như 1 “trạm ảo”
              if (count === 0) {
                const provSnap = await getDocs(
                  query(collection(db, 'privateProviders'), where('__name__', '==', cid))
                );
                if (!provSnap.empty) count = 1;
              }

              entries[cid] = count;
              log('Station count for company', cid, '=>', count);
            })
          );
          if (isMounted) setStationCountByCompany(entries);
        } else {
          if (isMounted) setStationCountByCompany({});
        }

        if (isAgent) {
          const joinedSnap = await getDocs(
            query(collection(db, 'programParticipants'), where('userId', '==', user.uid))
          );
          const joinedIds = joinedSnap.docs.map((d) => (d.data() as any).programId as string);
          log('Joined programs:', joinedIds);
          if (isMounted) setJoinedPrograms(joinedIds);
        }
      } catch (e: any) {
        err('Load programs error:', e);
        if (isMounted) setErrMsg(e?.message || 'Failed to load programs');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => { isMounted = false; };
  }, [user?.uid, role, ctxCompanyId, isCompanyCreator, isAgent, isAdmin, qpCompanyId, qpStationId]);

  /* ===== handlers ===== */
  const handleJoin = async (programId: string) => {
    if (!user) return;
    const { isAgent } = useRoleFlags(role);
    if (!isAgent || joinedPrograms.includes(programId)) return;

    await addDoc(collection(db, 'programParticipants'), {
      programId,
      userId: user.uid,
      userRole: role,
      status: 'joined',
      joinedAt: serverTimestamp(),
    });
    setJoinedPrograms((prev) => [...prev, programId]);
  };

  const handleDelete = async (programId: string) => {
    const { isAdmin, isCompanyCreator } = useRoleFlags(role);
    if (!isAdmin && !isCompanyCreator) return;
    const ok = typeof window !== 'undefined'
      ? window.confirm(t('programs_page.confirm_delete') ?? 'Delete this program?')
      : true;
    if (!ok) return;

    await deleteDoc(doc(db, 'programs', programId));
    setPrograms((prev) => prev.filter((p) => p.id !== programId));
  };

  /* ===== render utils ===== */
  const renderStatus = (program: Program) => {
    const now = Timestamp.now().toMillis();
    if (!program.isActive) return <Badge variant="secondary" size="sm">{t('programs_page.status.inactive')}</Badge>;
    const startMs = program.startDate?.toMillis?.();
    const endMs = program.endDate?.toMillis?.();
    if (startMs && startMs > now) return <Badge variant="outline" size="sm">{t('programs_page.status.upcoming')}</Badge>;
    if (endMs && endMs < now) return <Badge variant="destructive" size="sm">{t('programs_page.status.ended')}</Badge>;
    return <Badge variant="brand" size="sm">{t('programs_page.status.active')}</Badge>;
  };

  const fmt = (ts?: Timestamp | null) => (ts?.toDate ? format(ts.toDate(), 'yyyy-MM-dd') : '-');

  /* ===== UI ===== */
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10 space-y-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">🎯 {t('programs_page.title')}</h1>
            <p className="text-gray-600 text-sm sm:text-base max-w-3xl mt-1 md:px-12">
              {t('programs_page.subtitle')}
            </p>
          </div>

          {(useRoleFlags(role).isCompanyCreator || useRoleFlags(role).isAdmin) && (
            <Link
              href="/dashboard/programs/rental-programs/new"
              className="inline-block bg-[#00d289] hover:bg-[#00b67a] text-white font-medium px-4 py-2 sm:py-3 rounded-xl transition text-sm"
            >
              ➕ {t('programs_page.create_button')}
            </Link>
          )}
        </div>

        {loading && <div className="text-center py-10">Loading...</div>}
        {errMsg && <div className="text-center py-3 text-red-600 text-sm">{errMsg}</div>}

        {!loading && !errMsg && (programs.length === 0 ? (
          <p className="text-gray-500 text-center">{t('programs_page.no_programs')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => {
              const modelCount = getModelCount(program.modelDiscounts as any);
              const stationCount = getStationCount(program, stationCountByCompany);

              return (
                <div
                  key={program.id}
                  className="bg-white rounded-xl shadow p-4 sm:p-6 border space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                      <Link href={`/dashboard/programs/${program.id}`} className="text-[#00d289] hover:underline">
                        {program.title}
                      </Link>
                    </h2>

                    {program.description && (
                      <p className="text-gray-600 text-sm sm:text-base line-clamp-3">{program.description}</p>
                    )}

                    {/* Status + meta row */}
                    <div className="mt-2 sm:mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      {/* Left group: status + type */}
                      <div className="flex flex-wrap items-center gap-2">
                        {renderStatus(program)}

                        <Badge variant="outline" size="sm" className="whitespace-nowrap">
                          {t('programs_page.type')}:{' '}
                          <span className="capitalize ml-1">
                            {program.type?.replace?.(/_/g, ' ')}
                          </span>
                        </Badge>
                      </div>

                      {/* Right group: counts */}
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <Badge variant="outline" size="sm" className="whitespace-nowrap">
                          {t('programs_page.models', { count: modelCount })}
                        </Badge>

                        <Badge variant="outline" size="sm" className="whitespace-nowrap">
                          {t('programs_page.stations', { count: stationCount })}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{t('programs_page.duration')}:</span>{' '}
                      {fmt(program.startDate)} – {fmt(program.endDate)}
                    </div>
                  </div>

                  <ProgramActions
                    programId={program.id}
                    role={role}
                    joinedPrograms={joinedPrograms}
                    onJoin={handleJoin}
                    onDelete={handleDelete}
                    t={t}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </main>

      <Footer />
    </div>
  );
}
