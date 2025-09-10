// Xữ lý programs
// src/lib/programs/hooks/programsHooks.ts

'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  updateDoc,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  getCountFromServer,
  type Query,
  type CollectionReference,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type {
  Program,
  ProgramParticipant,
  ProgramParticipantStatus,
  ProgramStatus,
} from '@/src/lib/programs/rental-programs/programsType';

/* ===================== helpers (pure) ===================== */

const isTs = (v: unknown): v is Timestamp => v instanceof Timestamp;
const tsOrNull = (v: unknown): Timestamp | null => (isTs(v) ? v : null);

export function inferStatusFromDates(raw: any): ProgramStatus {
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

export function normalizeProgram(raw: any, id: string): Program {
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
    status: inferStatusFromDates(raw),
    isActive: raw?.isActive ?? true,
    // Chỉ dùng để hiển thị nếu có; UI/Hook sẽ override bằng aggregate count
    participantsCount: typeof raw?.participantsCount === 'number' ? raw.participantsCount : 0,
    ordersCount: typeof raw?.ordersCount === 'number' ? raw.ordersCount : undefined,
    createdAt: tsOrNull(raw?.createdAt) ?? Timestamp.now(),
    updatedAt: tsOrNull(raw?.updatedAt) ?? Timestamp.now(),
    endedAt: tsOrNull(raw?.endedAt),
    archivedAt: tsOrNull(raw?.archivedAt),
    canceledAt: tsOrNull(raw?.canceledAt),
  };
}

/* ===================== core: aggregate count ===================== */

async function countParticipants(programId: string) {
  const qRef = query(collection(db, 'programParticipants'), where('programId', '==', programId));
  const agg = await getCountFromServer(qRef);
  return agg.data().count;
}

/* ===================== Hook: list programs theo role ===================== */

type UseProgramsOptions = {
  companyId?: string | null;
  stationIdFilter?: string | null; // nếu cần chỉ hiện chương trình áp dụng trạm X
  withAccurateCount?: boolean;     // mặc định true → đếm aggregate
};

export function useProgramsByRole(
  role?: string,
  companyId?: string | null,
  opts?: UseProgramsOptions
) {
  const { stationIdFilter = null, withAccurateCount = true } = opts || {};
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const r = (role || '').toLowerCase();

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let qRef: Query | CollectionReference = collection(db, 'programs');

        if (r === 'agent') {
          qRef = query(collection(db, 'programs'), where('type', '==', 'agent_program'));
        } else if (['company_owner', 'private_provider', 'company_admin', 'station_manager'].includes(r)) {
          if (!companyId) {
            if (mounted) {
              setPrograms([]);
              setLoading(false);
            }
            return;
          }
          qRef = query(
            collection(db, 'programs'),
            where('type', '==', 'rental_program'),
            where('companyId', '==', companyId)
          );
        } else if (r === 'admin') {
          qRef = collection(db, 'programs');
        } else {
          if (mounted) {
            setPrograms([]);
            setLoading(false);
          }
          return;
        }

        const snap = await getDocs(qRef);
        let list = snap.docs.map((d) => normalizeProgram(d.data(), d.id));

        // filter theo station nếu cần
        if (stationIdFilter) {
          list = list.filter((p) => {
            const targets = Array.isArray(p.stationTargets) ? p.stationTargets : [];
            return targets.length === 0 || targets.some((t) => t?.stationId === stationIdFilter);
          });
        }

        if (withAccurateCount && list.length) {
          const counts = await Promise.all(list.map((p) => countParticipants(p.id).catch(() => p.participantsCount ?? 0)));
          list = list.map((p, i) => ({ ...p, participantsCount: counts[i] }));
        }

        if (mounted) setPrograms(list);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load programs');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [r, companyId, stationIdFilter, withAccurateCount]);

  return { programs, loading, error };
}

/* ===================== Hook: user đã join những program nào ===================== */

export function useJoinedPrograms(userId?: string | null) {
  const [programIds, setProgramIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setProgramIds([]);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, 'programParticipants'), where('userId', '==', userId))
        );
        const ids = snap.docs.map((d) => (d.data() as any).programId as string);
        if (mounted) setProgramIds(ids);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  return { programIds, loading };
}

/* ===================== Hook: tham gia chương trình ===================== */

export function useJoinProgram() {
  const join = useCallback(
    async (params: {
      programId: string;
      userId: string;
      userRole: 'agent' | 'customer' | 'staff';
      status?: ProgramParticipantStatus; // default 'joined'
    }): Promise<{ ok: boolean; already?: boolean; count?: number; error?: string }> => {
      const { programId, userId, userRole, status = 'joined' } = params;

      try {
        // kiểm tra idempotent bằng query (không đổi cấu trúc docId)
        const existed = await getDocs(
          query(
            collection(db, 'programParticipants'),
            where('programId', '==', programId),
            where('userId', '==', userId)
          )
        );
        if (!existed.empty) {
          const count = await countParticipants(programId).catch(() => undefined);
          return { ok: true, already: true, count };
        }

        // tạo mới participant
        await addDoc(collection(db, 'programParticipants'), {
          programId,
          userId,
          userRole,
          status,
          joinedAt: serverTimestamp(),
        } as Omit<ProgramParticipant, 'id'>);

        // đếm thật để trả về UI cập nhật chắc chắn
        const count = await countParticipants(programId).catch(() => undefined);
        return { ok: true, count };
      } catch (e: any) {
        return { ok: false, error: e?.message || 'Failed to join program' };
      }
    },
    []
  );

  return { join };
}

/* ===================== Hook: danh sách participants + count ===================== */

export function useProgramParticipants(programId?: string, listen = false) {
  const [participants, setParticipants] = useState<ProgramParticipant[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) {
      setParticipants([]);
      setCount(0);
      setLoading(false);
      return;
    }

    let unsub: (() => void) | null = null;
    let mounted = true;

    async function loadOnce() {
      setLoading(true);
      setError(null);
      try {
        const qRef = query(collection(db, 'programParticipants'), where('programId', '==', programId));
        const snap = await getDocs(qRef);
        const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as ProgramParticipant));
        const agg = await getCountFromServer(qRef);
        if (mounted) {
          setParticipants(list);
          setCount(agg.data().count);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load participants');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (listen) {
      const qRef = query(collection(db, 'programParticipants'), where('programId', '==', programId));
      unsub = onSnapshot(
        qRef,
        async (snap) => {
          const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) } as ProgramParticipant));
          const agg = await getCountFromServer(qRef).catch(() => null);
          if (mounted) {
            setParticipants(list);
            if (agg) setCount(agg.data().count);
            else setCount(list.length); // fallback nếu aggregate thất bại
          }
        },
        (err) => setError(err?.message || 'Failed to subscribe participants')
      );
      setLoading(false);
    } else {
      loadOnce();
    }

    return () => {
      mounted = false;
      if (unsub) unsub();
    };
  }, [programId, listen]);

  return { participants, count, loading, error };
}

/* ===================== Hook: lifecycle (end/archive/cancel) ===================== */

export function useProgramLifecycle() {
  const end = useCallback(async (programId: string) => {
    await updateDoc(doc(db, 'programs', programId), {
      status: 'ended',
      isActive: false,
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }, []);

  const archive = useCallback(async (programId: string) => {
    await updateDoc(doc(db, 'programs', programId), {
      status: 'archived',
      isActive: false,
      archivedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }, []);

  const cancel = useCallback(async (programId: string) => {
    await updateDoc(doc(db, 'programs', programId), {
      status: 'canceled',
      isActive: false,
      canceledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }, []);

  return { end, archive, cancel };
}
