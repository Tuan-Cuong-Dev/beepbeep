// Agent - Giới thiệu khách hàng và lịch sử hoa hồng
'use client';

import { useCallback } from 'react';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  startAfter,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

// ── Types
export type CommissionPolicy =
  | { mode: 'percent'; rate: number; min?: number; max?: number }
  | { mode: 'flat'; amount: number };

export type CommissionStatus = 'pending' | 'approved' | 'paid' | 'rejected';

export interface CommissionEntry {
  id: string;
  bookingId: string;
  agentId: string;
  agentProgramId?: string | null;

  amount: number;          // VND
  currency: 'VND';
  status: CommissionStatus;

  policy: CommissionPolicy;
  computedAt: Timestamp;

  snapshot?: {
    totalAmount?: number;
    basePrice?: number;
    rentalDays?: number;
    batteryFee?: number;
    deposit?: number;
  };

  // chống ghi trùng
  dedupeKey?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type AddEntryArgs = {
  bookingId: string;
  agentId: string;
  agentProgramId?: string | null;
  amount: number;
  currency?: 'VND';
  status?: CommissionStatus;      // mặc định pending
  policy: CommissionPolicy;
  computedAt?: Timestamp;
  snapshot?: CommissionEntry['snapshot'];
  dedupeKey?: string;             // ví dụ: `${bookingId}|confirmed`
};

// ── Helpers
const COLLECTION = 'commissionHistory';

const roundCurrency = (n: number, decimals = 0) => {
  const f = Math.pow(10, decimals);
  return Math.round((n + Number.EPSILON) * f) / f;
};

export function useCommissionHistory() {
  /** Tạo bản ghi hoa hồng (có idempotency nhẹ qua dedupeKey) */
  const addCommissionEntry = useCallback(async (args: AddEntryArgs) => {
    const payload = {
      bookingId: args.bookingId,
      agentId: args.agentId,
      agentProgramId: args.agentProgramId ?? null,
      amount: Math.max(0, roundCurrency(Number(args.amount) || 0)),
      currency: args.currency ?? 'VND',
      status: args.status ?? 'pending',
      policy: args.policy,
      computedAt: args.computedAt ?? Timestamp.now(),
      snapshot: args.snapshot ?? {},
      dedupeKey: args.dedupeKey ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Idempotency (nếu truyền dedupeKey)
    if (payload.dedupeKey) {
      const existsQ = query(
        collection(db, COLLECTION),
        where('dedupeKey', '==', payload.dedupeKey),
        limit(1)
      );
      const existsSnap = await getDocs(existsQ);
      if (!existsSnap.empty) {
        // đã có -> trả id cũ
        return existsSnap.docs[0].id;
      }
    }

    const ref = await addDoc(collection(db, COLLECTION), payload);
    return ref.id;
  }, []);

  /** Danh sách theo agent (mặc định 20), hỗ trợ phân trang cursor */
  const listCommissionByAgent = useCallback(
    async (agentId: string, take = 20, after?: QueryDocumentSnapshot) => {
      if (!agentId) return { items: [] as CommissionEntry[], lastDoc: undefined as QueryDocumentSnapshot | undefined };

      let qRef = query(
        collection(db, COLLECTION),
        where('agentId', '==', agentId),
        orderBy('createdAt', 'desc'),
        limit(take)
      );
      if (after) qRef = query(qRef, startAfter(after));

      const snap = await getDocs(qRef);
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as CommissionEntry);
      const lastDoc = snap.docs.at(-1);
      return { items, lastDoc };
    },
    []
  );

  /** Danh sách theo booking (mặc định 20), hỗ trợ phân trang */
  const listCommissionByBooking = useCallback(
    async (bookingId: string, take = 20, after?: QueryDocumentSnapshot) => {
      if (!bookingId) return { items: [] as CommissionEntry[], lastDoc: undefined as QueryDocumentSnapshot | undefined };

      let qRef = query(
        collection(db, COLLECTION),
        where('bookingId', '==', bookingId),
        orderBy('createdAt', 'desc'),
        limit(take)
      );
      if (after) qRef = query(qRef, startAfter(after));

      const snap = await getDocs(qRef);
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as CommissionEntry);
      const lastDoc = snap.docs.at(-1);
      return { items, lastDoc };
    },
    []
  );

  /**
   * Cập nhật trạng thái: KHUYẾN NGHỊ chuyển sang server action / callable function
   * để enforce quyền & nghiệp vụ (VD: chỉ admin/company_owner mới được approved/paid).
   * Tạm thời giữ phiên bản trực tiếp cho môi trường dev.
   */
  const updateCommissionStatus = useCallback(
    async (entryId: string, status: CommissionStatus) => {
      await updateDoc(doc(db, COLLECTION, entryId), {
        status,
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  return {
    addCommissionEntry,
    listCommissionByAgent,
    listCommissionByBooking,
    updateCommissionStatus, // production: gọi API server thay vì trực tiếp
  };
}
