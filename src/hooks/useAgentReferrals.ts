//Agent -  Giới thiệu khách hàng và lịch sử hoa hồng

'use client';

import { useEffect, useState } from 'react';
import {
  addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, Timestamp, updateDoc, where
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { AgentReferral, ReferralStatus } from '@/src/lib/agents/referralTypes';

export function useAgentReferrals(agentId?: string) {
  const [items, setItems] = useState<AgentReferral[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const toTs = (v: any): Timestamp =>
    v instanceof Timestamp ? v : Timestamp.fromDate(new Date(v?.seconds ? v.toDate?.() ?? new Date() : v || Date.now()));

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
      const list: AgentReferral[] = snap.docs.map(d => {
        const x = d.data() as any;
        return {
          id: d.id,
          agentId: x.agentId,
          companyId: x.companyId,
          stationId: x.stationId,
          fullName: x.fullName || '',
          phone: x.phone || '',
          note: x.note || '',
          status: (x.status as ReferralStatus) || 'new',
          source: x.source || 'agent_form',
          bookingId: x.bookingId,
          commissionAmount: typeof x.commissionAmount === 'number' ? x.commissionAmount : undefined,
          createdAt: toTs(x.createdAt),
          updatedAt: toTs(x.updatedAt),
        };
      });
      setItems(list);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [agentId]);

  const create = async (data: {
    fullName: string; phone: string; note?: string; companyId?: string; stationId?: string;
  }) => {
    if (!agentId) return null;
    const payload = {
      ...data,
      agentId,
      status: 'new',
      source: 'agent_form' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const ref = await addDoc(collection(db, 'agentReferrals'), payload);
    setItems(prev => [{ id: ref.id, ...(payload as any), createdAt: Timestamp.now(), updatedAt: Timestamp.now() }, ...prev]);
    return ref.id;
  };

  const updateStatus = async (id: string, status: ReferralStatus, extra?: Partial<AgentReferral>) => {
    const ref = doc(db, 'agentReferrals', id);
    await updateDoc(ref, { status, ...(extra || {}), updatedAt: serverTimestamp() });
    setItems(prev => prev.map(it => it.id === id ? { ...it, status, ...(extra || {}), updatedAt: Timestamp.now() } : it));
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, 'agentReferrals', id));
    setItems(prev => prev.filter(x => x.id !== id));
  };

  return { items, loading, create, updateStatus, remove, refresh: fetchAll };
}
