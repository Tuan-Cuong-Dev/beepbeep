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
  DocumentData,
  QueryConstraint,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

/* ===================== Types ===================== */

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
    totalAmount?: number;  // Tổng tiền đơn (nếu có)
    basePrice?: number;    // Giá thuê/ngày (nếu có)
    rentalDays?: number;   // Số ngày thuê (nếu có)
    batteryFee?: number;   // Phụ phí pin (nếu có)
    deposit?: number;      // Đặt cọc (nếu có)
    baseForCommission?: number; // Nếu có sẵn base cụ thể để tính hoa hồng
  };

  // chống ghi trùng
  dedupeKey?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ===================== Helpers (pure) ===================== */

const COLLECTION = 'commissionHistory' as const;

const roundCurrency = (n: number, decimals = 0) => {
  const f = Math.pow(10, decimals);
  return Math.round((n + Number.EPSILON) * f) / f;
};

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

function isNumLike(v: unknown): v is number | string {
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') return !Number.isNaN(parseNumberLike(v));
  return false;
}

function parseNumberLike(s: string): number {
  if (/%$/.test(s.trim())) {
    const raw = s.trim().replace('%', '');
    return Number(raw.replace(/[^\d.-]/g, '')) || 0;
  }
  return Number(s.replace(/[^\d.-]/g, '')) || 0;
}

function toRate(v: unknown): number {
  if (typeof v === 'number') return v > 1 ? v / 100 : v;
  if (typeof v === 'string') {
    const n = parseNumberLike(v);
    return n > 1 ? n / 100 : n;
  }
  return 0;
}

function toMoney(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') return parseNumberLike(v);
  return 0;
}

function coerceMinMax(minIn?: unknown, maxIn?: unknown): { min?: number; max?: number } {
  const hasMin = isNumLike(minIn);
  const hasMax = isNumLike(maxIn);
  const min = hasMin ? toMoney(minIn) : undefined;
  const max = hasMax ? toMoney(maxIn) : undefined;
  if (min !== undefined && max !== undefined && min > max) return { min: max, max: min };
  return { min, max };
}

export function normalizeCommissionPolicy(raw: any): CommissionPolicy | null {
  if (!raw || typeof raw !== 'object') return null;

  if (raw.mode === 'percent' && isNumLike(raw.rate)) {
    const rate = clamp(toRate(raw.rate), 0, 1);
    const { min, max } = coerceMinMax(raw.min, raw.max);
    return { mode: 'percent', rate, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
  }
  if (raw.mode === 'flat' && isNumLike(raw.amount)) {
    return { mode: 'flat', amount: toMoney(raw.amount) };
  }

  // biến thể cũ (type/value)
  if ((raw.mode === 'percent' || raw.type === 'percentage') && isNumLike(raw.value)) {
    const rate = clamp(toRate(raw.value), 0, 1);
    const { min, max } = coerceMinMax(raw.min, raw.max);
    return { mode: 'percent', rate, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) };
  }
  if ((raw.mode === 'flat' || raw.type === 'flat') && isNumLike(raw.value)) {
    return { mode: 'flat', amount: toMoney(raw.value) };
  }
  return null;
}

export function computeCommission(policy: CommissionPolicy | null | undefined, base: number): number {
  const amountBase = Math.max(0, Number(base) || 0);
  if (!policy) return 0;

  if (policy.mode === 'percent') {
    const pct = clamp(policy.rate, 0, 1);
    let val = amountBase * pct;
    if (isNumLike(policy.min)) val = Math.max(val, Number(policy.min));
    if (isNumLike(policy.max)) val = Math.min(val, Number(policy.max));
    return roundCurrency(val); // VND → làm tròn tới đồng
  }
  if (policy.mode === 'flat') {
    return roundCurrency(Math.max(0, Number(policy.amount) || 0));
  }
  return 0;
}

/* ===================== Hook ===================== */

type AddEntryArgs = {
  bookingId: string;
  agentId: string;
  agentProgramId?: string | null;

  /** Nếu không truyền hoặc <=0, hook sẽ thử tính từ snapshot/policy */
  amount?: number;
  currency?: 'VND';
  status?: CommissionStatus;      // mặc định pending
  policy: CommissionPolicy | any; // chấp nhận raw, sẽ normalize
  computedAt?: Timestamp;
  snapshot?: CommissionEntry['snapshot'];
  dedupeKey?: string;             // ví dụ: `${bookingId}|confirmed`
};

type ListOpts = {
  take?: number;                           // page size (mặc định 20)
  status?: CommissionStatus | 'all';       // filter status
  from?: Timestamp;                        // createdAt >= from
  to?: Timestamp;                          // createdAt <= to
  after?: QueryDocumentSnapshot<DocumentData>; // cursor
};

type ListResult = {
  items: CommissionEntry[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
  totalCount?: number;                     // nếu cần, có thể trả bằng getCountFromServer
};

export function useCommissionHistory() {
  /** Tạo bản ghi hoa hồng (có idempotency chắc hơn) */
  const addCommissionEntry = useCallback(async (args: AddEntryArgs) => {
    const normalizedPolicy = normalizeCommissionPolicy(args.policy);
    if (!normalizedPolicy) {
      throw new Error('Invalid commission policy');
    }

    // Tính amount nếu không truyền hoặc không hợp lệ
    let finalAmount = Number(args.amount);
    if (!Number.isFinite(finalAmount) || finalAmount <= 0) {
      // ưu tiên snapshot.baseForCommission; fallback totalAmount; rồi tới basePrice*rentalDays + batteryFee
      const base =
        Number(args?.snapshot?.baseForCommission) ||
        Number(args?.snapshot?.totalAmount) ||
        (Number(args?.snapshot?.basePrice) || 0) * (Number(args?.snapshot?.rentalDays) || 0) +
          (Number(args?.snapshot?.batteryFee) || 0);
      finalAmount = computeCommission(normalizedPolicy, base);
    }
    finalAmount = Math.max(0, roundCurrency(finalAmount));

    const payload = {
      bookingId: args.bookingId,
      agentId: args.agentId,
      agentProgramId: args.agentProgramId ?? null,
      amount: finalAmount,
      currency: args.currency ?? 'VND',
      status: args.status ?? 'pending',
      policy: normalizedPolicy,
      computedAt: args.computedAt ?? Timestamp.now(),
      snapshot: args.snapshot ?? {},
      dedupeKey: args.dedupeKey ?? null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Idempotency:
    // 1) nếu có dedupeKey → kiểm tra theo key
    if (payload.dedupeKey) {
      const existsQ = query(
        collection(db, COLLECTION),
        where('dedupeKey', '==', payload.dedupeKey),
        limit(1)
      );
      const existsSnap = await getDocs(existsQ);
      if (!existsSnap.empty) {
        return existsSnap.docs[0].id;
      }
    } else {
      // 2) fallback: kiểm tra theo (bookingId, agentId, policy.mode, status) gần nhất
      const existsQ = query(
        collection(db, COLLECTION),
        where('bookingId', '==', payload.bookingId),
        where('agentId', '==', payload.agentId),
        where('status', '==', payload.status),
        limit(1)
      );
      const existsSnap = await getDocs(existsQ);
      if (!existsSnap.empty) {
        return existsSnap.docs[0].id;
      }
    }

    const ref = await addDoc(collection(db, COLLECTION), payload);
    return ref.id;
  }, []);

  /** Danh sách theo agent (có filter status/from/to, phân trang cursor) */
  const listCommissionByAgent = useCallback(
    async (agentId: string, opts: ListOpts = {}): Promise<ListResult> => {
      if (!agentId) return { items: [], lastDoc: undefined, hasMore: false };

      const take = Math.max(1, opts.take ?? 20);
      const cons: QueryConstraint[] = [
        where('agentId', '==', agentId),
        orderBy('createdAt', 'desc'),
        limit(take),
      ];

      if (opts.status && opts.status !== 'all') cons.unshift(where('status', '==', opts.status));
      if (opts.from) cons.unshift(where('createdAt', '>=', opts.from));
      if (opts.to) cons.unshift(where('createdAt', '<=', opts.to));
      if (opts.after) cons.push(startAfter(opts.after));

      const qRef = query(collection(db, COLLECTION), ...cons);
      const snap = await getDocs(qRef);
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as CommissionEntry);
      const lastDoc = snap.docs.at(-1);
      const hasMore = snap.size >= take;

      return { items, lastDoc, hasMore };
    },
    []
  );

  /** Danh sách theo booking (có filter status/from/to, phân trang cursor) */
  const listCommissionByBooking = useCallback(
    async (bookingId: string, opts: ListOpts = {}): Promise<ListResult> => {
      if (!bookingId) return { items: [], lastDoc: undefined, hasMore: false };

      const take = Math.max(1, opts.take ?? 20);
      const cons: QueryConstraint[] = [
        where('bookingId', '==', bookingId),
        orderBy('createdAt', 'desc'),
        limit(take),
      ];

      if (opts.status && opts.status !== 'all') cons.unshift(where('status', '==', opts.status));
      if (opts.from) cons.unshift(where('createdAt', '>=', opts.from));
      if (opts.to) cons.unshift(where('createdAt', '<=', opts.to));
      if (opts.after) cons.push(startAfter(opts.after));

      const qRef = query(collection(db, COLLECTION), ...cons);
      const snap = await getDocs(qRef);
      const items = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }) as CommissionEntry);
      const lastDoc = snap.docs.at(-1);
      const hasMore = snap.size >= take;

      return { items, lastDoc, hasMore };
    },
    []
  );

  /** Tổng số bản ghi theo agent (nhanh gọn, dùng aggregate count) */
  const countByAgent = useCallback(async (agentId: string, status?: CommissionStatus | 'all') => {
    if (!agentId) return 0;
    const cons: QueryConstraint[] = [where('agentId', '==', agentId)];
    if (status && status !== 'all') cons.push(where('status', '==', status));
    const qRef = query(collection(db, COLLECTION), ...cons);
    const agg = await getCountFromServer(qRef);
    return agg.data().count;
  }, []);

  /**
   * Cập nhật trạng thái:
   * PRODUCTION: khuyến nghị chuyển vào server action / callable để enforce quyền.
   * Ở client dev giữ tạm hàm trực tiếp.
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

  /** Helper phân trang: truyền lại cursor từ lần trước */
  const getNextPage = useCallback(
    async <T extends 'agent' | 'booking'>(
      type: T,
      id: string,
      opts: Omit<ListOpts, 'after'> & { after?: QueryDocumentSnapshot<DocumentData> }
    ) => {
      return type === 'agent'
        ? listCommissionByAgent(id, opts)
        : listCommissionByBooking(id, opts);
    },
    [listCommissionByAgent, listCommissionByBooking]
  );

  return {
    addCommissionEntry,
    listCommissionByAgent,
    listCommissionByBooking,
    countByAgent,
    updateCommissionStatus, // production: gọi API server thay vì trực tiếp
    getNextPage,
    // Tiện ích pure nếu cần dùng ngoài:
    normalizeCommissionPolicy,
    computeCommission,
  };
}
