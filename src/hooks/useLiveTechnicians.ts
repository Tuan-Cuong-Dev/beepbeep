// hooks/useLiveTechnicians.ts
// Xử lý theo dõi kỹ thuật viên lưu động di chuyển (realtime presence + đường đi)
'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { COLLECTIONS } from '@/src/lib/tracking/collections';

type LiveStatus = 'online' | 'paused' | 'offline';

type Presence = {
  /** UID của kỹ thuật viên (nên là users.doc.id) */
  techId: string;
  name?: string | null;
  companyName?: string | null;
  /** Ghi trực tiếp bởi publisher vào collection presence (nếu có) */
  avatarUrl?: string | null;
  lat: number;
  lng: number;
  status?: LiveStatus;
  sessionId?: string | null;
};

type UserLite = {
  name?: string | null;
  photoURL?: string | null;
  companyName?: string | null;
};

/** Lấy danh sách kỹ thuật viên đang online (kèm avatar).
 *  Ưu tiên ảnh từ presence.avatarUrl, nếu không có sẽ fallback users.photoURL. */
export function useTechnicianPresence() {
  const [presence, setPresence] = useState<Presence[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserLite>>({}); // key = users.doc.id (uid)

  // Realtime presence
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'technician_presence'), (snap) => {
      const arr: Presence[] = snap.docs.map((d) => {
        const x = d.data() as any;
        return {
          techId: x.techId || d.id, // đảm bảo là uid
          name: x.name ?? null,
          companyName: x.companyName ?? null,
          avatarUrl: x.avatarUrl ?? null,
          lat: Number(x.lat),
          lng: Number(x.lng),
          status: (x.status as LiveStatus) ?? 'offline',
          sessionId: x.sessionId ?? null,
        };
      });
      setPresence(arr);
    });
    return () => unsub();
  }, []);

  // One-shot: load users để lấy photoURL
  useEffect(() => {
    (async () => {
      const snap = await getDocs(collection(db, 'users'));
      const map: Record<string, UserLite> = {};
      snap.forEach((doc) => {
        const u = doc.data() as any;
        map[doc.id] = {
          name: u.name ?? null,
          photoURL: u.photoURL ?? null, // đúng field theo schema của bạn
          companyName: u.companyName ?? null,
        };
      });
      setUserMap(map);
    })();
  }, []);

  // Merge presence + users
  const merged = useMemo(() => {
    return presence.map((p) => {
      const extra = userMap[p.techId] || {};
      return {
        ...p,
        name: p.name ?? extra.name ?? p.techId,
        companyName: p.companyName ?? extra.companyName ?? null,
        // Ưu tiên ảnh từ presence; nếu không có thì dùng users.photoURL
        avatarUrl: p.avatarUrl ?? extra.photoURL ?? null,
      };
    });
  }, [presence, userMap]);

  return merged;
}

/** Lấy polyline (đường đi) theo ca làm việc (session) của một kỹ thuật viên. */
export function useTrackPolyline(techId: string, sessionId?: string) {
  const [points, setPoints] = useState<{ lat: number; lng: number }[]>([]);

  useEffect(() => {
    if (!techId || !sessionId) {
      setPoints([]);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.points(techId, sessionId)),
      orderBy('t', 'asc'),
      limit(2000) // tránh tải quá nặng
    );

    const unsub = onSnapshot(q, (snap) => {
      setPoints(
        snap.docs.map((d) => {
          const v = d.data() as any;
          return { lat: Number(v.lat), lng: Number(v.lng) };
        })
      );
    });

    return () => unsub();
  }, [techId, sessionId]);

  return points;
}
