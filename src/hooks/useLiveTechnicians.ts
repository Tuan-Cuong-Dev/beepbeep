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
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { COLLECTIONS } from '@/src/lib/tracking/collections';

type LiveStatus = 'online' | 'paused' | 'offline';

type Presence = {
  /** UID của kỹ thuật viên (nên là users.doc.id) */
  techId: string;
  name?: string | null;
  companyName?: string | null;

  /** Avatar ưu tiên từ presence; nếu không có sẽ fallback users.photoURL (ở dưới) */
  avatarUrl?: string | null;

  /** Toạ độ hiện tại */
  lat: number;
  lng: number;

  /** Độ chính xác (m) — nếu có, dùng để vẽ vòng sai số */
  accuracy?: number | null;

  /** Thời điểm cập nhật cuối cùng (millis) — convert từ serverTimestamp() nếu có */
  updatedAt?: number | null;

  /** Trạng thái & ca hiện tại */
  status?: LiveStatus;
  sessionId?: string | null;
};

type UserLite = {
  name?: string | null;
  photoURL?: string | null;
  companyName?: string | null;
};

type PresenceOptions = {
  /** Mặc định: true — kết hợp với bảng users để lấy photoURL */
  joinUsers?: boolean;
  /** Mặc định: false — nếu true sẽ chỉ trả về online */
  onlineOnly?: boolean;
};

/** Lấy danh sách kỹ thuật viên đang hoạt động (kèm avatar).
 *  Ưu tiên ảnh từ presence.avatarUrl; nếu trống, fallback users.photoURL. */
export function useTechnicianPresence(opts: PresenceOptions = {}) {
  const { joinUsers = true, onlineOnly = false } = opts;

  const [presence, setPresence] = useState<Presence[]>([]);
  const [userMap, setUserMap] = useState<Record<string, UserLite>>({}); // key = users.doc.id (uid)

  // Realtime presence
  useEffect(() => {
    let unsub: Unsubscribe | null = null;

    unsub = onSnapshot(collection(db, 'technician_presence'), (snap) => {
      const arr: Presence[] = snap.docs.map((d) => {
        const x = d.data() as any;

        // Convert updatedAt -> millis nếu có
        const updatedAt =
          typeof x?.updatedAt?.toMillis === 'function'
            ? x.updatedAt.toMillis()
            : typeof x?.updatedAt === 'number'
            ? x.updatedAt
            : null;

        const lat = Number(x.lat);
        const lng = Number(x.lng);

        return {
          techId: x.techId || d.id, // đảm bảo là uid
          name: x.name ?? null,
          companyName: x.companyName ?? null,
          avatarUrl: x.avatarUrl ?? null,
          lat: Number.isFinite(lat) ? lat : 0,
          lng: Number.isFinite(lng) ? lng : 0,
          accuracy: Number.isFinite(Number(x.accuracy)) ? Number(x.accuracy) : null,
          updatedAt,
          status: (x.status as LiveStatus) ?? 'offline',
          sessionId: x.sessionId ?? null,
        };
      });

      // Tuỳ chọn lọc online
      setPresence(onlineOnly ? arr.filter((p) => p.status === 'online') : arr);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [onlineOnly]);

  // One-shot: load users để lấy photoURL
  useEffect(() => {
    if (!joinUsers) return;

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
  }, [joinUsers]);

  // Merge presence + users
  const merged = useMemo(() => {
    return presence.map((p) => {
      const extra = joinUsers ? userMap[p.techId] || {} : {};
      return {
        ...p,
        name: p.name ?? extra.name ?? p.techId,
        companyName: p.companyName ?? extra.companyName ?? null,
        // Ưu tiên ảnh từ presence; nếu không có thì dùng users.photoURL
        avatarUrl: p.avatarUrl ?? extra.photoURL ?? null,
      };
    });
  }, [presence, userMap, joinUsers]);

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

    // Ghi chú:
    // - Bạn đã lưu t: Date (JS date) trong publisher → orderBy('t','asc') sẽ hoạt động
    // - Nếu t là Firestore Timestamp: orderBy('t','asc') vẫn OK
    const q = query(
      collection(db, COLLECTIONS.points(techId, sessionId)),
      orderBy('t', 'asc'),
      limit(2000) // tránh tải quá nặng
    );

    const unsub = onSnapshot(q, (snap) => {
      setPoints(
        snap.docs.map((d) => {
          const v = d.data() as any;
          const lat = Number(v.lat);
          const lng = Number(v.lng);
          return {
            lat: Number.isFinite(lat) ? lat : 0,
            lng: Number.isFinite(lng) ? lng : 0,
          };
        })
      );
    });

    return () => unsub();
  }, [techId, sessionId]);

  return points;
}
