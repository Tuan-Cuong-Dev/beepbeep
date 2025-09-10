'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
  Timestamp,
  Query,
  CollectionReference,
  getCountFromServer,          // ✅ dùng aggregate count
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
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import type { Program, ProgramStatus } from '@/src/lib/programs/rental-programs/programsType';

/* ================= Helpers ================= */

type ProgramEx = Program & {
  participantsCount?: number;
  isArchived?: boolean;          // giữ cờ tương thích cũ nếu từng lưu
  endedAt?: Timestamp | null;
  archivedAt?: Timestamp | null;
};

const LOG = true;
const log = (...a: any[]) => LOG && console.log('[ProgramsPage]', ...a);
const warn = (...a: any[]) => LOG && console.warn('[ProgramsPage]', ...a);
const err = (...a: any[]) => LOG && console.error('[ProgramsPage]', ...a);

const normalizeRole = (r?: string) => (r || '').toLowerCase();
const useRoleFlags = (role?: string) => {
  const r = normalizeRole(role);
  return {
    isAgent: r === 'agent',
    isAdmin: r === 'admin',
    isCompanyCreator: ['company_owner', 'private_provider', 'company_admin', 'station_manager'].includes(r),
  };
};

const isTs = (v: any): v is Timestamp => v instanceof Timestamp;
const tsOrNull = (v: any): Timestamp | null => (isTs(v) ? v : null);

/** Suy ra status từ thời gian & isActive (tương thích dữ liệu cũ) */
function inferStatusFromDates(raw: any): ProgramStatus {
  const active = raw?.isActive !== false;
  const start = tsOrNull(raw?.startDate)?.toMillis?.() ?? null;
  const end = tsOrNull(raw?.endDate)?.toMillis?.() ?? null;
  const now = Date.now();

  if (raw?.status) return raw.status as ProgramStatus;
  if (!active) return 'paused';
  if (start && now < start) return 'scheduled';
  if (end && now > end) return 'ended';
  return 'active';
}

/** Chuẩn hóa Program đọc từ Firestore (có status) */
const normalizeProgram = (raw: any, id: string): ProgramEx => {
  const status = inferStatusFromDates(raw);
  const isArchivedCompat = !!raw?.isArchived || status === 'archived';

  return {
    id,
    title: raw?.title ?? '',
    description: raw?.description ?? '',
    type: raw?.type ?? 'rental_program',
    createdByUserId: raw?.createdByUserId ?? '',
    createdByRole: raw?.createdByRole ?? 'company_owner',
    companyId: raw?.companyId ?? null,
    stationTargets: Array.isArray(raw?.stationTargets) ? raw.stationTargets : [],
    modelDiscounts: Array.isArray(raw?.modelDiscounts) ? raw.modelDiscounts : raw?.modelDiscounts ?? [],
    startDate: tsOrNull(raw?.startDate),
    endDate: tsOrNull(raw?.endDate),
    status,                             // <-- đảm bảo luôn có
    isActive: raw?.isActive ?? true,    // cờ tương thích, UI nên ưu tiên status
    participantsCount: typeof raw?.participantsCount === 'number' ? raw.participantsCount : 0,
    // lifecycle
    createdAt: tsOrNull(raw?.createdAt) ?? Timestamp.now(),
    updatedAt: tsOrNull(raw?.updatedAt) ?? Timestamp.now(),
    endedAt: tsOrNull(raw?.endedAt),
    archivedAt: tsOrNull(raw?.archivedAt),
    isArchived: isArchivedCompat,
  };
};

/** Đếm mẫu xe: hỗ trợ cả object legacy và array mới */
function getModelCount(modelDiscounts: any): number {
  if (Array.isArray(modelDiscounts)) return modelDiscounts.length;
  if (modelDiscounts && typeof modelDiscounts === 'object') return Object.keys(modelDiscounts).length;
  return 0;
}

type StationCountMap = Record<string, number>; // companyId -> count

/** Đếm trạm hiển thị cho card */
function getStationCount(program: ProgramEx, stationCountByCompany: StationCountMap): number {
  const t = Array.isArray(program.stationTargets) ? program.stationTargets : [];
  if (t.length > 0) return t.length;
  if (program.companyId) {
    const n = stationCountByCompany[program.companyId];
    return typeof n === 'number' ? n : 0;
  }
  return 0;
}

/* ================= Actions (card) ================= */

type ActionsProps = {
  program: ProgramEx;
  role?: string;
  joinedPrograms: string[];
  onJoin: (programId: string) => void;
  onEnd: (program: ProgramEx) => void;
  onArchive: (program: ProgramEx) => void;
  onDelete: (program: ProgramEx) => void;
  t: (k: string, p?: any) => string;
};

function ProgramActions({
  program,
  role,
  joinedPrograms,
  onJoin,
  onEnd,
  onArchive,
  onDelete,
  t,
}: ActionsProps) {
  const { isAgent, isAdmin, isCompanyCreator } = useRoleFlags(role);
  const canManage = isAdmin || isCompanyCreator;

  if (isAgent) {
    const joined = joinedPrograms.includes(program.id);
    return (
      <div className="space-y-2">
        {joined ? (
          <div className="text-green-600 font-medium text-sm">✅ {t('programs_page.joined')}</div>
        ) : (
          <Button size="sm" onClick={() => onJoin(program.id)}>
            {t('programs_page.join_button')}
          </Button>
        )}
      </div>
    );
  }

  if (canManage) {
    const hasParticipants = (program.participantsCount ?? 0) > 0;

    return (
      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href={`/dashboard/programs/${program.id}/participants`}
          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-md text-center transition text-sm"
        >
          {t('programs_page.view_participants')}
        </Link>

        {hasParticipants ? (
          <>
            <Button
              size="sm"
              variant={program.status === 'active' ? 'default' : 'secondary'}
              onClick={() => onEnd(program)}
            >
              {program.status === 'active'
                ? t('programs_page.end_button', 'Kết thúc')
                : t('programs_page.ended', 'Đã kết thúc')}
            </Button>
            <Button
              size="sm"
              variant={program.status === 'archived' ? 'secondary' : 'outline'}
              onClick={() => onArchive(program)}
            >
              {program.status === 'archived'
                ? t('programs_page.archived', 'Đã lưu trữ')
                : t('programs_page.archive_button', 'Lưu trữ')}
            </Button>
          </>
        ) : (
          // Chỉ render Xóa khi chưa ai tham gia
          <Button size="sm" variant="destructive" onClick={() => onDelete(program)}>
            {t('programs_page.delete_button')}
          </Button>
        )}
      </div>
    );
  }

  return null;
}

/* ================= Page ================= */

export default function ProgramsPageClient() {
  const { t } = useTranslation('common');
  const { user, role, companyId: ctxCompanyId } = useUser() as any;

  const search = useSearchParams();
  const qpCompanyId = search?.get('companyId') ?? null;
  const qpStationId = search?.get('stationId') ?? null;

  const [programs, setPrograms] = useState<ProgramEx[]>([]);
  const [joinedPrograms, setJoinedPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Đếm trạm toàn công ty (áp dụng khi stationTargets rỗng)
  const [stationCountByCompany, setStationCountByCompany] = useState<StationCountMap>({});

  // Dialog state
  const [dialog, setDialog] = useState<{
    open: boolean;
    type: 'confirm' | 'success' | 'error' | 'info' | 'custom';
    title: string;
    description?: string;
    onConfirm?: () => void;
  }>({ open: false, type: 'confirm', title: '' });

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

  // ✅ helper đếm aggregate participants cho 1 program
  const fetchRealParticipantsCount = async (programId: string) => {
    const qRef = query(collection(db, 'programParticipants'), where('programId', '==', programId));
    const agg = await getCountFromServer(qRef);
    return agg.data().count;
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

        // Chuẩn hoá & lọc theo station (nếu có)
        let list = snap.docs.map((d) => normalizeProgram(d.data() as any, d.id));

        if (qpStationId) {
          const before = list.length;
          list = list.filter((p) => {
            const targets = Array.isArray(p.stationTargets) ? p.stationTargets : [];
            return targets.length === 0 || targets.some((t: any) => t?.stationId === qpStationId);
          });
          log(`Filter by stationId=${qpStationId}: ${before} -> ${list.length}`);
        }

        // ✅ Gán participantsCount CHÍNH XÁC bằng aggregate
        if (list.length) {
          const counts = await Promise.all(
            list.map(async (p) => {
              try {
                return await fetchRealParticipantsCount(p.id);
              } catch {
                return p.participantsCount ?? 0;
              }
            })
          );
          list = list.map((p, i) => ({ ...p, participantsCount: counts[i] }));
        }

        if (isMounted) setPrograms(list);

        // Build company station counts (apply-to-all stations)
        const companyIds = Array.from(
          new Set(list.filter((p) => !p.stationTargets?.length && p.companyId).map((p) => p.companyId as string))
        );

        if (companyIds.length) {
          const entries: StationCountMap = {};
          await Promise.all(
            companyIds.map(async (cid) => {
              const stSnap = await getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', cid)));
              let count = stSnap.size;

              // Fallback nếu là provider không có trạm vật lý → coi như 1 “trạm ảo”
              if (count === 0) {
                const provSnap = await getDocs(query(collection(db, 'privateProviders'), where('__name__', '==', cid)));
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

        // Lấy danh sách program đã join (cho Agent)
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

    return () => {
      isMounted = false;
    };
  }, [user?.uid, role, ctxCompanyId, isCompanyCreator, isAgent, isAdmin, qpCompanyId, qpStationId]);

  /* ================= Handlers ================= */

  const handleJoin = async (programId: string) => {
    if (!user) return;
    const { isAgent } = useRoleFlags(role);
    if (!isAgent || joinedPrograms.includes(programId)) return;

    // ✅ idempotent check (programId + userId)
    const existed = await getDocs(
      query(
        collection(db, 'programParticipants'),
        where('programId', '==', programId),
        where('userId', '==', user.uid)
      )
    );
    if (existed.empty) {
      await addDoc(collection(db, 'programParticipants'), {
        programId,
        userId: user.uid,
        userRole: role,               // role hiện tại của user
        status: 'joined',
        joinedAt: serverTimestamp(),
      });
    }

    // cập nhật state joined
    setJoinedPrograms((prev) => (prev.includes(programId) ? prev : [...prev, programId]));

    // ✅ đếm lại CHUẨN bằng aggregate (tránh lệch khi nhiều client)
    let accurate = (programs.find((p) => p.id === programId)?.participantsCount ?? 0);
    try {
      accurate = await fetchRealParticipantsCount(programId);
    } catch {
      // fallback: +1 nếu không lấy được aggregate
      accurate = accurate + 1;
    }

    setPrograms((prev) =>
      prev.map((p) =>
        p.id === programId ? { ...p, participantsCount: accurate } : p
      )
    );
  };

  const confirm = (opts: { title: string; description?: string; onConfirm: () => void }) =>
    setDialog({ open: true, type: 'confirm', title: opts.title, description: opts.description, onConfirm: opts.onConfirm });

  const closeDialog = () => setDialog((d) => ({ ...d, open: false }));

  // Kết thúc chương trình (status='ended', isActive=false, endedAt=now)
  const handleEnd = (program: ProgramEx) => {
    confirm({
      title: t('programs_page.confirm_end_title', 'Kết thúc chương trình?'),
      description: t(
        'programs_page.confirm_end_desc',
        'Sau khi kết thúc, chương trình không còn hiệu lực cho đơn mới.'
      ),
      onConfirm: async () => {
        await updateDoc(doc(db, 'programs', program.id), {
          status: 'ended',
          isActive: false,
          endedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === program.id ? { ...p, status: 'ended', isActive: false, endedAt: Timestamp.now() } : p
          )
        );
        closeDialog();
      },
    });
  };

  // Lưu trữ chương trình (status='archived', isActive=false)
  const handleArchive = (program: ProgramEx) => {
    confirm({
      title: t('programs_page.confirm_archive_title', 'Lưu trữ chương trình?'),
      description: t(
        'programs_page.confirm_archive_desc',
        'Chương trình sẽ chuyển sang trạng thái lưu trữ (ẩn với người dùng).'
      ),
      onConfirm: async () => {
        await updateDoc(doc(db, 'programs', program.id), {
          status: 'archived',
          isActive: false,
          isArchived: true, // giữ tương thích cũ nếu UI khác đang đọc cờ này
          archivedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        setPrograms((prev) =>
          prev.map((p) =>
            p.id === program.id
              ? {
                  ...p,
                  status: 'archived',
                  isActive: false,
                  isArchived: true,
                  archivedAt: Timestamp.now(),
                }
              : p
          )
        );
        closeDialog();
      },
    });
  };

  // Xóa chương trình (CHỈ khi participantsCount===0)
  const handleDelete = (program: ProgramEx) => {
    if ((program.participantsCount ?? 0) > 0) {
      setDialog({
        open: true,
        type: 'info',
        title: t('programs_page.delete_blocked_title', 'Không thể xóa'),
        description: t(
          'programs_page.delete_blocked_has_participants',
          'Chương trình đã có người tham gia. Hãy kết thúc hoặc lưu trữ để đảm bảo công bằng.'
        ),
      });
      return;
    }
    confirm({
      title: t('programs_page.confirm_delete', 'Xóa chương trình này?'),
      description: t('programs_page.delete_desc', 'Hành động không thể hoàn tác.'),
      onConfirm: async () => {
        await deleteDoc(doc(db, 'programs', program.id));
        setPrograms((prev) => prev.filter((p) => p.id !== program.id));
        closeDialog();
      },
    });
  };

  /* ================= Render helpers ================= */

  const renderStatus = (program: ProgramEx) => {
    // Ưu tiên status chuẩn hoá
    switch (program.status) {
      case 'archived':
        return <Badge variant="secondary" size="sm">{t('programs_page.status.archived', 'Đã lưu trữ')}</Badge>;
      case 'canceled':
        return <Badge variant="secondary" size="sm">{t('programs_page.status.canceled', 'Đã huỷ')}</Badge>;
      case 'ended':
        return <Badge variant="destructive" size="sm">{t('programs_page.status.ended')}</Badge>;
      case 'scheduled':
        return <Badge variant="outline" size="sm">{t('programs_page.status.upcoming')}</Badge>;
      case 'paused':
        return <Badge variant="secondary" size="sm">{t('programs_page.status.inactive')}</Badge>;
      case 'active':
      default:
        return <Badge variant="brand" size="sm">{t('programs_page.status.active')}</Badge>;
    }
  };

  const fmt = (ts?: Timestamp | null) => (ts?.toDate ? format(ts.toDate(), 'yyyy-MM-dd') : '-');

  /* ================= UI ================= */

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
                          <span className="capitalize ml-1">{program.type?.replace?.(/_/g, ' ')}</span>
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

                        <Badge variant="outline" size="sm" className="whitespace-nowrap">
                          {t('programs_page.participants', { count: program.participantsCount ?? 0 })}
                        </Badge>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{t('programs_page.duration')}:</span>{' '}
                      {fmt(program.startDate)} – {fmt(program.endDate)}
                    </div>
                  </div>

                  <ProgramActions
                    program={program}
                    role={role}
                    joinedPrograms={joinedPrograms}
                    onJoin={handleJoin}
                    onEnd={handleEnd}
                    onArchive={handleArchive}
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

      <NotificationDialog
        open={dialog.open}
        type={dialog.type}
        title={dialog.title}
        description={dialog.description}
        onClose={closeDialog}
        onConfirm={dialog.onConfirm}
      />
    </div>
  );
}
