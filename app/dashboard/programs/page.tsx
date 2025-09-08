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
  Timestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import type { Program } from '@/src/lib/programs/rental-programs/programsType';

export default function ProgramsPage() {
  const { t } = useTranslation('common');
  const { user, role, companyId: ctxCompanyId } = useUser() as any;

  const [programs, setPrograms] = useState<Program[]>([]);
  const [joinedPrograms, setJoinedPrograms] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isAgent = role === 'agent';
  const isAdmin = role === 'Admin' || role === 'admin';
  const isCompanyOwner = ['company_owner', 'private_provider', 'company_admin', 'station_manager'].includes(role || '');

  const normalizeProgram = (raw: any, id: string): Program => ({
    id,
    title: raw.title,
    description: raw.description,
    type: raw.type,
    createdByUserId: raw.createdByUserId,
    createdByRole: raw.createdByRole,
    companyId: raw.companyId ?? null,
    stationTargets: raw.stationTargets ?? [],
    modelDiscounts: raw.modelDiscounts ?? [],
    startDate: raw.startDate instanceof Timestamp ? raw.startDate : null,
    endDate: raw.endDate instanceof Timestamp ? raw.endDate : null,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt ?? Timestamp.now(),
    updatedAt: raw.updatedAt ?? Timestamp.now(),
  });

  // Nếu context chưa có companyId (một số vai trò), thử fetch từ Firestore
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
      setErr(null);
      try {
        // Xác định companyId nếu cần
        const companyId =
          isCompanyOwner && !ctxCompanyId ? await fetchCompanyId(user.uid) : ctxCompanyId ?? null;

        // Query theo vai trò:
        // - agent: chỉ xem agent_program (của toàn hệ thống)
        // - company owner/admin/station_manager: rental_program của companyId
        // - admin: xem tất cả
        let qRef:
          | ReturnType<typeof collection>
          | ReturnType<typeof query> = collection(db, 'programs');

        if (isAgent) {
          qRef = query(collection(db, 'programs'), where('type', '==', 'agent_program'));
        } else if (isCompanyOwner) {
          if (!companyId) {
            // Không có công ty -> không hiển thị
            if (isMounted) {
              setPrograms([]);
            }
            setLoading(false);
            return;
          }
          qRef = query(
            collection(db, 'programs'),
            where('type', '==', 'rental_program'),
            where('companyId', '==', companyId)
          );
        } else if (isAdmin) {
          qRef = collection(db, 'programs');
        } else {
          if (isMounted) setPrograms([]);
          setLoading(false);
          return;
        }

        const snap = await getDocs(qRef);
        const list = snap.docs.map((d) => normalizeProgram(d.data(), d.id));
        if (isMounted) setPrograms(list);

        if (isAgent) {
          const joinedSnap = await getDocs(
            query(collection(db, 'programParticipants'), where('userId', '==', user.uid))
          );
          const joinedIds = joinedSnap.docs.map((d) => d.data().programId as string);
          if (isMounted) setJoinedPrograms(joinedIds);
        }
      } catch (e: any) {
        if (isMounted) setErr(e?.message || 'Failed to load programs');
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [user?.uid, role, ctxCompanyId, isCompanyOwner, isAgent, isAdmin]);

  const handleJoin = async (programId: string) => {
    if (!user || !isAgent) return;
    if (joinedPrograms.includes(programId)) return; // chặn join trùng

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
    if (!isCompanyOwner && !isAdmin) return;
    const ok = typeof window !== 'undefined' ? window.confirm(t('programs_page.confirm_delete') ?? 'Delete this program?') : true;
    if (!ok) return;

    await deleteDoc(doc(db, 'programs', programId));
    setPrograms((prev) => prev.filter((p) => p.id !== programId));
  };

  const renderStatus = (program: Program) => {
    // Sửa logic: không có endDate => không coi là ended
    const now = Timestamp.now().toMillis();
    if (!program.isActive) {
      return <Badge variant="secondary" size="sm">{t('programs_page.status.inactive')}</Badge>;
    }
    const startMs = program.startDate?.toMillis?.();
    const endMs = program.endDate?.toMillis?.();

    if (startMs && startMs > now) {
      return <Badge variant="outline" size="sm">{t('programs_page.status.upcoming')}</Badge>;
    }
    if (endMs && endMs < now) {
      return <Badge variant="destructive" size="sm">{t('programs_page.status.ended')}</Badge>;
    }
    return <Badge variant="brand" size="sm">{t('programs_page.status.active')}</Badge>;
  };

  const fmt = (ts?: Timestamp | null) => (ts?.toDate ? format(ts.toDate(), 'yyyy-MM-dd') : '-');

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

          {(isCompanyOwner || isAdmin) && (
            <Link
              href="/dashboard/programs/rental-programs/new"
              className="inline-block bg-[#00d289] hover:bg-[#00b67a] text-white font-medium px-4 py-2 sm:py-3 rounded-xl transition text-sm"
            >
              ➕ {t('programs_page.create_button')}
            </Link>
          )}
        </div>

        {loading && <div className="text-center py-10">Loading...</div>}
        {err && <div className="text-center py-3 text-red-600 text-sm">{err}</div>}

        {!loading && !err && (programs.length === 0 ? (
          <p className="text-gray-500 text-center">{t('programs_page.no_programs')}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((program) => {
              const modelCount = program.modelDiscounts?.length ?? 0;
              const stationCount = program.stationTargets?.length ?? 0;

              return (
                <div
                  key={program.id}
                  className="bg-white rounded-xl shadow p-4 sm:p-6 border space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-800">
                      <Link
                        href={`/dashboard/programs/${program.id}`}
                        className="text-[#00d289] hover:underline"
                      >
                        {program.title}
                      </Link>
                    </h2>

                    {program.description && (
                      <p className="text-gray-600 text-sm sm:text-base line-clamp-3">{program.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatus(program)}

                      <Badge variant="outline" size="sm">
                        {t('programs_page.type')}:{' '}
                        <span className="capitalize ml-1">
                          {program.type?.replace?.(/_/g, ' ')}
                        </span>
                      </Badge>

                      <Badge variant="outline" size="sm">
                        {t('programs_page.models', { count: modelCount })}
                      </Badge>

                      <Badge variant="outline" size="sm">
                        {t('programs_page.stations', { count: stationCount })}
                      </Badge>
                    </div>


                    <div className="text-xs text-gray-500">
                      <span className="font-medium text-gray-700">{t('programs_page.duration')}:</span>{' '}
                      {fmt(program.startDate)} – {fmt(program.endDate)}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {isAgent && (
                      joinedPrograms.includes(program.id) ? (
                        <div className="text-green-600 font-medium text-sm">
                          ✅ {t('programs_page.joined')}
                        </div>
                      ) : (
                        <Button size="sm" onClick={() => handleJoin(program.id)}>
                          {t('programs_page.join_button')}
                        </Button>
                      )
                    )}

                    {(isCompanyOwner || isAdmin) && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Link
                          href={`/dashboard/programs/${program.id}/participants`}
                          className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-md text-center transition text-sm"
                        >
                          {t('programs_page.view_participants')}
                        </Link>

                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(program.id)}
                        >
                          {t('programs_page.delete_button')}
                        </Button>
                      </div>
                    )}
                  </div>
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
