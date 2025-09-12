// Agent - Giới thiệu khách hàng và lịch sử hoa hồng
'use client';

import { useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query,
  serverTimestamp, Timestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

import type {
  AgentReferral,
  ReferralStatus,
  AgentReferralCreateInput,
  AgentReferralUpdateInput,
  VehicleType,
  ContactChannel,
  PreferredLanguage,
  AgentReferralMeta,
  SplitPreset,
} from '@/src/lib/agents/referralTypes';

/* ================= Helpers ================= */
type FireLike =
  | Timestamp
  | Date
  | number
  | string
  | { seconds: number; nanoseconds?: number }
  | null
  | undefined;

function toTimestamp(input: FireLike): Timestamp | null {
  if (input == null) return null;
  if (input instanceof Timestamp) return input;
  if (input instanceof Date)     return Timestamp.fromDate(input);
  if (typeof input === 'number') return Timestamp.fromMillis(input);
  if (typeof input === 'string') {
    const ms = new Date(input).getTime();
    return Number.isNaN(ms) ? null : Timestamp.fromMillis(ms);
  }
  const any = input as any;
  if (typeof any?.seconds === 'number') {
    const sec = Number(any.seconds);
    const ns  = Number(any.nanoseconds ?? 0);
    return Timestamp.fromMillis(sec * 1000 + Math.floor(ns / 1e6));
  }
  return null;
}

const clamp = (n: any, min: number, max: number) =>
  Math.max(min, Math.min(max, Number(n)));

const asIntOr = (v: any, def: number, min = 1, max = 999) =>
  Number.isFinite(Number(v)) ? clamp(Math.round(Number(v)), min, max) : def;

/** 50_50 → 50 (% bạn nhận) */
const presetToPct = (preset?: SplitPreset, explicit?: number | null | undefined) => {
  if (explicit != null) return clamp(explicit, 0, 100);
  switch (preset) {
    case '50_50': return 50;
    case '70_30': return 70;
    case '100_0': return 100;
    case 'custom': default: return undefined;
  }
};

/** undefined → null (để tránh undefined vào Firestore) */
function nvl<T>(v: T | undefined, fallback: T | null = null): T | null {
  return (v === undefined ? fallback : v) as any;
}

/** Chuẩn hoá teammate: luôn không có undefined lồng nhau */
function normalizeTeammate(tm: any | null | undefined) {
  if (!tm) return null;
  return {
    name: tm.name ?? null,
    phone: tm.phone ?? null,
  };
}

/** Bỏ tất cả key có value === undefined (đệ quy) — dùng cho update patch */
function removeUndefinedDeep<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(removeUndefinedDeep) as any;
  const out: any = {};
  Object.entries(obj as any).forEach(([k, v]) => {
    if (v === undefined) return;
    if (v && typeof v === 'object') out[k] = removeUndefinedDeep(v);
    else out[k] = v;
  });
  return out;
}

/** Map Firestore doc -> AgentReferral (điền mặc định an toàn) */
function mapDocToReferral(id: string, x: any): AgentReferral {
  return {
    id,
    agentId: x.agentId,

    companyId: x.companyId ?? undefined,
    stationId: x.stationId ?? undefined,

    fullName: x.fullName ?? '',
    phone: x.phone ?? '',
    note: x.note ?? '',

    expectedStart: toTimestamp(x.expectedStart) ?? null,
    rentalDays: typeof x.rentalDays === 'number' ? x.rentalDays : undefined,
    quantity: typeof x.quantity === 'number' ? x.quantity : undefined,

    vehicleType: (x.vehicleType as VehicleType) ?? undefined,
    modelHint: x.modelHint ?? undefined,
    contactChannel: (x.contactChannel as ContactChannel) ?? undefined,
    preferredLanguage: (x.preferredLanguage as PreferredLanguage) ?? undefined,
    programId: x.programId ?? null,
    sourceTag: x.sourceTag ?? undefined,
    consentContact: typeof x.consentContact === 'boolean' ? x.consentContact : undefined,

    teammate: x.teammate ?? undefined,
    splitPreset: x.splitPreset as SplitPreset | undefined,
    splitSelfPct: typeof x.splitSelfPct === 'number' ? x.splitSelfPct : undefined,

    attributionLocked: !!x.attributionLocked,

    status: (x.status as ReferralStatus) ?? 'new',
    source: x.source ?? 'agent_form',
    bookingId: x.bookingId ?? undefined,

    commissionAmount: typeof x.commissionAmount === 'number' ? x.commissionAmount : undefined,

    createdAt: toTimestamp(x.createdAt) ?? Timestamp.now(),
    updatedAt: toTimestamp(x.updatedAt) ?? Timestamp.now(),

    meta: x.meta as AgentReferralMeta | undefined,
  };
}

/* ================= Hook chính ================= */
export function useAgentReferrals(agentId?: string) {
  const [items, setItems] = useState<AgentReferral[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAll = async () => {
    if (!agentId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'agentReferrals'),
          where('agentId', '==', agentId),
          orderBy('createdAt', 'desc')
        )
      );
      const list: AgentReferral[] = snap.docs.map(d => mapDocToReferral(d.id, d.data()));
      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [agentId]);

  /* -------- create -------- */
  const create = async (data: AgentReferralCreateInput) => {
    if (!agentId) return null;

    const nowServer = serverTimestamp();
    const expectedStartTs = toTimestamp(data.expectedStart);
    const splitSelfPct = presetToPct(data.splitPreset, data.splitSelfPct);

    const payload = removeUndefinedDeep({
      agentId,

      fullName: data.fullName,
      phone: data.phone,
      note: nvl(data.note, ''),

      // quick fields
      expectedStart: expectedStartTs,
      rentalDays: asIntOr((data as any).rentalDays, 1),
      quantity: asIntOr((data as any).quantity, 1),
      vehicleType: data.vehicleType ?? 'motorbike',
      modelHint: nvl(data.modelHint),

      contactChannel: nvl(data.contactChannel),
      preferredLanguage: nvl(data.preferredLanguage),
      programId: nvl(data.programId),
      sourceTag: nvl(data.sourceTag),
      consentContact: data.consentContact ?? true,

      teammate: normalizeTeammate((data as any).teammate),
      splitPreset: nvl(data.splitPreset),
      splitSelfPct: splitSelfPct ?? null,

      attributionLocked: !!(data as any).attributionLocked,

      // legacy links (nếu có)
      companyId: nvl(data.companyId),
      stationId: nvl(data.stationId),

      status: (data.status as ReferralStatus) ?? 'new',
      source: (data.source ?? 'agent_form') as 'agent_form' | 'agent_link',
      bookingId: null,

      commissionAmount: null,

      createdAt: nowServer,
      updatedAt: nowServer,

      meta: removeUndefinedDeep({
        byAgentId: agentId,
        preferredLanguage: data.preferredLanguage ?? null,
        sourceTag: data.sourceTag ?? null,
        ...(data.meta || {}),
      } as AgentReferralMeta),
    });

    const ref = await addDoc(collection(db, 'agentReferrals'), payload);

    // Optimistic update
    setItems(prev => [
      mapDocToReferral(ref.id, {
        ...payload,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }),
      ...prev,
    ]);

    return ref.id;
  };

  /* -------- update status nhanh -------- */
  const updateStatus = async (id: string, status: ReferralStatus, extra?: Partial<AgentReferral>) => {
    const ref = doc(db, 'agentReferrals', id);

    const patchRaw: any = { status, updatedAt: serverTimestamp() };
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (v === undefined) return;
        if (k === 'expectedStart') patchRaw.expectedStart = toTimestamp(v as FireLike);
        else if (k === 'rentalDays' || k === 'quantity') patchRaw[k] = asIntOr(v, 1);
        else if (k === 'splitSelfPct') patchRaw.splitSelfPct = clamp(v as number, 0, 100);
        else if (k === 'teammate') patchRaw.teammate = normalizeTeammate(v as any);
        else patchRaw[k] = v;
      });
    }

    const patch = removeUndefinedDeep(patchRaw);
    await updateDoc(ref, patch);

    setItems(prev =>
      prev.map(it =>
        it.id === id
          ? mapDocToReferral(id, {
              ...it,
              ...extra,
              status,
              updatedAt: Timestamp.now(),
            })
          : it
      )
    );
  };

  /* -------- update linh hoạt -------- */
  const updateReferral = async (id: string, data: AgentReferralUpdateInput) => {
    const ref = doc(db, 'agentReferrals', id);

    const patchRaw: any = { updatedAt: serverTimestamp() };
    Object.entries(data).forEach(([k, v]) => {
      if (v === undefined) return;
      if (k === 'expectedStart') patchRaw.expectedStart = toTimestamp(v as FireLike);
      else if (k === 'rentalDays' || k === 'quantity') patchRaw[k] = asIntOr(v, 1);
      else if (k === 'splitSelfPct') patchRaw.splitSelfPct = clamp(v as number, 0, 100);
      else if (k === 'teammate') patchRaw.teammate = normalizeTeammate(v as any);
      else patchRaw[k] = v;
    });

    // nếu đổi preset mà không truyền splitSelfPct → tự tính
    if ('splitPreset' in data && !('splitSelfPct' in data)) {
      patchRaw.splitSelfPct = presetToPct(data.splitPreset as SplitPreset | undefined, undefined) ?? null;
    }

    const patch = removeUndefinedDeep(patchRaw);
    await updateDoc(ref, patch);

    setItems(prev =>
      prev.map(it =>
        it.id === id
          ? mapDocToReferral(id, {
              ...it,
              ...data,
              updatedAt: Timestamp.now(),
            })
          : it
      )
    );
  };

  /* -------- delete -------- */
  const remove = async (id: string) => {
    await deleteDoc(doc(db, 'agentReferrals', id));
    setItems(prev => prev.filter(x => x.id !== id));
  };

  return {
    items,
    loading,
    refresh: fetchAll,
    create,
    updateStatus,
    updateReferral,
    remove,
  };
}
