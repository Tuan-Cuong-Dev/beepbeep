// hooks/usePublicIssuesToDispatch.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  Unsubscribe,
} from 'firebase/firestore';
import type { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';

type Options = {
  /** Nếu là technician_partner: chỉ lấy issue được assign cho user này */
  scopeToUid?: string | null;
  /** Bật realtime qua onSnapshot (mặc định: false dùng getDocs) */
  withRealtime?: boolean;

  /** Điều khiển đọc các “map” theo quyền để tránh lỗi permission */
  loadStaffs?: boolean;             // đọc /staffs
  loadUsers?: boolean;              // đọc /users
  loadTechnicianPartners?: boolean; // đọc /technicianPartners
};

export function usePublicIssuesToDispatch(opts: Options = {}) {
  const {
    scopeToUid = null,
    withRealtime = false,
    loadStaffs = true,
    loadUsers = true,
    loadTechnicianPartners = true,
  } = opts;

  const [issues, setIssues] = useState<PublicVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [technicianMap, setTechnicianMap] = useState<Record<string, string>>({});
  const [userMap, setUserMap]             = useState<Record<string, string>>({});
  const [partnerMap, setPartnerMap]       = useState<Record<string, string>>({});

  const unsubRef = useRef<Unsubscribe | null>(null);
  const prevHashRef = useRef<string>("");

  // ---------------- helpers ----------------
  const shallowEqualObj = (a: Record<string, string>, b: Record<string, string>) => {
    const ak = Object.keys(a), bk = Object.keys(b);
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (a[k] !== b[k]) return false;
    return true;
  };

  const setIfChanged = <T extends Record<string, string>>(
    setter: (v: T) => void,
    prev: T,
    next: T
  ) => {
    if (!shallowEqualObj(prev, next)) setter(next);
  };

  const loadTechnicianMap = useCallback(async () => {
    if (!loadStaffs) return {};
    const snap = await getDocs(collection(db, 'staffs'));
    const map: Record<string, string> = {};
    snap.forEach(d => {
      const data = d.data() as any;
      if (data?.userId) map[data.userId] = data.name || 'Unnamed';
    });
    return map;
  }, [loadStaffs]);

  const loadUserMap = useCallback(async () => {
    if (!loadUsers) return {};
    const snap = await getDocs(collection(db, 'users'));
    const map: Record<string, string> = {};
    snap.forEach(d => {
      const data = d.data() as any;
      map[d.id] = data?.name || data?.email || 'Unknown';
    });
    return map;
  }, [loadUsers]);

  const loadTechnicianPartnerMap = useCallback(async () => {
    if (!loadTechnicianPartners) return {};
    const snap = await getDocs(collection(db, 'technicianPartners'));
    const map: Record<string, string> = {};
    snap.forEach(d => {
      const data = d.data() as any;
      map[d.id] = data?.name || 'Unnamed Partner';
    });
    return map;
  }, [loadTechnicianPartners]);

  const hashIssues = useCallback((arr: PublicVehicleIssue[]) => {
    // hash nhẹ: length + id + updatedAt (nếu có) + status
    const key = arr
      .map(i => `${i.id}:${(i as any).updatedAt?.seconds ?? ''}:${i.status ?? ''}`)
      .join('|');
    return `${arr.length}#${key}`;
  }, []);

  const enrich = useCallback((raw: PublicVehicleIssue[]) => {
    const combinedAssignedName = (assignedTo?: string, assignedToName?: string) => {
      if (assignedToName) return assignedToName; // giữ tên đã lưu
      if (!assignedTo) return undefined;
      // Ưu tiên partner, sau đó staff
      return partnerMap[assignedTo] ?? technicianMap[assignedTo] ?? undefined;
    };

    return raw.map(issue => ({
      ...issue,
      assignedToName: combinedAssignedName(issue.assignedTo as any, (issue as any).assignedToName),
      closedByName:
        (issue as any).closedByName ??
        ((issue as any).closedBy ? userMap[(issue as any).closedBy] : undefined),
    }));
  }, [partnerMap, technicianMap, userMap]);

  const applyIssues = useCallback((raw: PublicVehicleIssue[]) => {
    const enriched = enrich(raw);
    const h = hashIssues(enriched);
    if (h !== prevHashRef.current) {
      prevHashRef.current = h;
      setIssues(enriched);
    }
  }, [enrich, hashIssues]);

  // ---------------- fetch / realtime ----------------
  const attachOrFetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [techMap, usrMap, partnerNameMap] = await Promise.all([
        loadTechnicianMap(),
        loadUserMap(),
        loadTechnicianPartnerMap(),
      ]);

      setIfChanged(setTechnicianMap, technicianMap, techMap);
      setIfChanged(setUserMap, userMap, usrMap);
      setIfChanged(setPartnerMap, partnerMap, partnerNameMap);

      const baseCol = collection(db, 'publicVehicleIssues');
      const q = scopeToUid ? query(baseCol, where('assignedTo', '==', scopeToUid)) : baseCol;

      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }

      if (withRealtime) {
        unsubRef.current = onSnapshot(
          q,
          snap => {
            const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as PublicVehicleIssue));
            applyIssues(raw);
            setLoading(false);
          },
          err => {
            setError(err.message || 'Failed to listen issues');
            setLoading(false);
          }
        );
      } else {
        const snap = await getDocs(q);
        const raw = snap.docs.map(d => ({ id: d.id, ...d.data() } as PublicVehicleIssue));
        applyIssues(raw);
        setLoading(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch public vehicle issues');
      setLoading(false);
    }
  }, [
    scopeToUid,
    withRealtime,
    loadTechnicianMap,
    loadUserMap,
    loadTechnicianPartnerMap,
    technicianMap,
    userMap,
    partnerMap,
    applyIssues,
  ]);

  useEffect(() => {
    attachOrFetch();
    return () => {
      if (unsubRef.current) {
        unsubRef.current();
        unsubRef.current = null;
      }
    };
  }, [attachOrFetch]);

  const refresh = useCallback(() => attachOrFetch(), [attachOrFetch]);

  const updateIssue = useCallback(async (id: string, data: Partial<PublicVehicleIssue>) => {
    await updateDoc(doc(db, 'publicVehicleIssues', id), data as any);
  }, []);

  return useMemo(
    () => ({
      issues,
      loading,
      error,
      updateIssue,
      refresh,
      technicianMap,
      userMap,
      partnerMap,
    }),
    [issues, loading, error, updateIssue, refresh, technicianMap, userMap, partnerMap]
  );
}
