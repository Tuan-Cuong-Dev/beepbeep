// Agent - Giới thiệu khách hàng và lịch sử hoa hồng
'use client';

import { useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query,
  serverTimestamp, Timestamp, updateDoc, where,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

// ⚠️ đảm bảo file này export đủ các type đã chốt
import type {
  AgentReferral,
  ReferralStatus,
  VehicleType,
  ContactChannel,
  PreferredLanguage,
  AgentReferralMeta,
} from '@/src/lib/agents/referralTypes';

/* ================= Helpers: Timestamp & mapping ================= */
type FireLike =
  | Timestamp
  | Date
  | number
  | string
  | { seconds: number; nanoseconds?: number }
  | null
  | undefined;

/** Chuyển nhiều kiểu đầu vào → Firestore Timestamp (hoặc null) */
function toTimestamp(input: FireLike): Timestamp | null {
  if (input == null) return null;

  if (input instanceof Timestamp) return input;

  if (input instanceof Date) return Timestamp.fromDate(input);

  if (typeof input === 'number') return Timestamp.fromMillis(input);

  if (typeof input === 'string') {
    const ms = new Date(input).getTime();
    return Number.isNaN(ms) ? null : Timestamp.fromMillis(ms);
  }

  if (typeof (input as any)?.seconds === 'number') {
    const sec = Number((input as any).seconds);
    const ns = Number((input as any).nanoseconds ?? 0);
    return Timestamp.fromMillis(sec * 1000 + Math.floor(ns / 1e6));
  }

  return null;
}

/** Map Firestore doc -> AgentReferral (điền mặc định an toàn) */
function mapDocToReferral(id: string, x: any): AgentReferral {
  return {
    id,
    agentId: x.agentId,
    companyId: x.companyId,
    stationId: x.stationId,

    fullName: x.fullName ?? '',
    phone: x.phone ?? '',
    note: x.note ?? '',

    expectedStart: toTimestamp(x.expectedStart) ?? null,
    vehicleType: (x.vehicleType as VehicleType) ?? undefined,
    modelHint: x.modelHint ?? undefined,
    contactChannel: (x.contactChannel as ContactChannel) ?? undefined,
    preferredLanguage: (x.preferredLanguage as PreferredLanguage) ?? undefined,
    programId: x.programId ?? null,
    sourceTag: x.sourceTag ?? undefined,
    consentContact: typeof x.consentContact === 'boolean' ? x.consentContact : undefined,

    status: (x.status as ReferralStatus) ?? 'new',
    source: x.source ?? 'agent_form',
    bookingId: x.bookingId ?? undefined,

    commissionAmount: typeof x.commissionAmount === 'number' ? x.commissionAmount : undefined,

    createdAt: toTimestamp(x.createdAt) ?? Timestamp.now(),
    updatedAt: toTimestamp(x.updatedAt) ?? Timestamp.now(),

    meta: x.meta as AgentReferralMeta | undefined,
  };
}

/* ================= Types cho create/update ================= */
export type AgentReferralCreateInput = {
  fullName: string;
  phone: string;
  note?: string;

  companyId?: string;
  stationId?: string;

  expectedStart?: FireLike;                // Date/Timestamp/ISO/{seconds,nanoseconds}/number
  vehicleType?: VehicleType;
  modelHint?: string;
  contactChannel?: ContactChannel;
  preferredLanguage?: PreferredLanguage;
  programId?: string | null;
  sourceTag?: string;
  consentContact?: boolean;

  source?: 'agent_form' | 'agent_link';   // mặc định: 'agent_form'
  meta?: AgentReferralMeta;               // { byAgentId, preferredLanguage, sourceTag }
};

export type AgentReferralUpdateInput = Partial<
  Omit<AgentReferral,
    'id' | 'agentId' | 'createdAt' | 'updatedAt'
  >
> & {
  expectedStart?: FireLike;               // cho phép nhiều format khi update
};

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

  useEffect(() => { fetchAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [agentId]);

  /* -------- create -------- */
  const create = async (data: AgentReferralCreateInput) => {
    if (!agentId) return null;

    const expectedStartTs = toTimestamp(data.expectedStart);
    const nowServer = serverTimestamp();

    const payload = {
      agentId,
      // root fields
      fullName: data.fullName,
      phone: data.phone,
      note: data.note ?? '',

      companyId: data.companyId ?? '',
      stationId: data.stationId ?? '',

      expectedStart: expectedStartTs,
      vehicleType: data.vehicleType ?? null,
      modelHint: data.modelHint ?? null,
      contactChannel: data.contactChannel ?? null,
      preferredLanguage: data.preferredLanguage ?? null,
      programId: data.programId ?? null,
      sourceTag: data.sourceTag ?? null,
      consentContact: typeof data.consentContact === 'boolean' ? data.consentContact : true,

      status: 'new' as ReferralStatus,
      source: (data.source ?? 'agent_form') as 'agent_form' | 'agent_link',
      bookingId: null,

      commissionAmount: null,

      createdAt: nowServer,
      updatedAt: nowServer,

      // meta mở rộng
      meta: {
        byAgentId: agentId,
        preferredLanguage: data.preferredLanguage,
        sourceTag: data.sourceTag,
        ...(data.meta || {}),
      } as AgentReferralMeta,
    };

    const ref = await addDoc(collection(db, 'agentReferrals'), payload);

    // Optimistic update (dùng Timestamp.now() cho UI)
    setItems(prev => [
      {
        id: ref.id,
        ...payload,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      } as unknown as AgentReferral,
      ...prev,
    ]);

    return ref.id;
  };

  /* -------- update status (nhanh) -------- */
  const updateStatus = async (id: string, status: ReferralStatus, extra?: Partial<AgentReferral>) => {
    const ref = doc(db, 'agentReferrals', id);

    // chuẩn hóa expectedStart nếu nằm trong extra
    const patch: any = { status, updatedAt: serverTimestamp() };
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => {
        if (k === 'expectedStart') patch.expectedStart = toTimestamp(v as FireLike);
        else patch[k] = v;
      });
    }

    await updateDoc(ref, patch);

    setItems(prev =>
      prev.map(it =>
        it.id === id
          ? {
              ...it,
              ...extra,
              status,
              expectedStart:
                extra && 'expectedStart' in extra
                  ? (toTimestamp((extra as any).expectedStart) ?? it.expectedStart ?? null)
                  : it.expectedStart ?? null,
              updatedAt: Timestamp.now(),
            }
          : it
      )
    );
  };

  /* -------- update bất kỳ field (patch) -------- */
  const updateReferral = async (id: string, data: AgentReferralUpdateInput) => {
    const ref = doc(db, 'agentReferrals', id);

    const patch: any = { updatedAt: serverTimestamp() };
    Object.entries(data).forEach(([k, v]) => {
      if (k === 'expectedStart') patch.expectedStart = toTimestamp(v as FireLike);
      else patch[k] = v;
    });

    await updateDoc(ref, patch);

    setItems(prev =>
      prev.map(it =>
        it.id === id
          ? {
              ...it,
              ...data,
              expectedStart:
                'expectedStart' in data
                  ? (toTimestamp(data.expectedStart as FireLike) ?? it.expectedStart ?? null)
                  : it.expectedStart ?? null,
              updatedAt: Timestamp.now(),
            }
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
    updateReferral, // ← update linh hoạt
    remove,
  };
}
