'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  documentId,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { ProgramParticipant, ProgramParticipantStatus } from '@/src/lib/programs/rental-programs/programsType';
import type { Agent } from '@/src/lib/agents/agentTypes';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { format } from 'date-fns';
import { useUser } from '@/src/context/AuthContext';

type Role = 'agent' | 'customer' | 'staff';

const chunk = <T,>(arr: T[], size = 10) =>
  Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );

export default function ProgramParticipantsPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const programId = params?.programId as string;
  const { user } = useUser();

  const [participants, setParticipants] = useState<ProgramParticipant[]>([]);
  const [agentByOwnerId, setAgentByOwnerId] = useState<Record<string, Agent>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!programId) return;

    let mounted = true;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        // 1) Lấy participants của program
        const ps = await getDocs(
          query(collection(db, 'programParticipants'), where('programId', '==', programId))
        );
        const list = ps.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as ProgramParticipant[];

        if (!mounted) return;
        setParticipants(list);

        // 2) Lấy thông tin agents liên quan (theo ownerId = userId)
        const agentOwnerIds = Array.from(
          new Set(list.filter(p => p.userRole === 'agent').map(p => p.userId))
        );
        if (agentOwnerIds.length === 0) {
          if (mounted) setAgentByOwnerId({});
          return;
        }

        const merged: Record<string, Agent> = {};
        for (const ids of chunk(agentOwnerIds, 10)) {
          const snap = await getDocs(
            query(collection(db, 'agents'), where('ownerId', 'in', ids))
          );
          snap.forEach(docu => {
            const a = { id: docu.id, ...(docu.data() as any) } as Agent;
            merged[a.ownerId] = a; // map theo ownerId để lookup nhanh
          });
        }
        if (mounted) setAgentByOwnerId(merged);
      } catch (e: any) {
        if (mounted) setErr(e?.message || 'Failed to load participants');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, [programId]);

  const fmtDate = (ts?: Timestamp) =>
    ts?.toDate ? format(ts.toDate(), 'yyyy-MM-dd HH:mm') : '—';

  const RoleBadge = ({ role }: { role: Role }) => (
    <Badge variant="outline" size="sm" className="capitalize">
      {role}
    </Badge>
  );

  const StatusBadge = ({ status }: { status: ProgramParticipantStatus }) => {
    switch (status) {
      case 'joined':
        return <Badge variant="brand" size="sm">{t('program_participants_page.status_joined')}</Badge>;
      case 'pending':
        return <Badge variant="warning" size="sm">{t('program_participants_page.status_pending')}</Badge>;
      case 'rejected':
        return <Badge variant="destructive" size="sm">{t('program_participants_page.status_rejected')}</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  // ====== NEW: Cập nhật trạng thái duyệt/từ chối ======
  const handleSetStatus = async (p: ProgramParticipant, newStatus: ProgramParticipantStatus) => {
    if (!p?.id) return;
    if (p.status === newStatus) return;

    setUpdatingId(p.id);
    setErr(null);
    try {
      await updateDoc(doc(db, 'programParticipants', p.id), {
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.uid || null,
      });

      // Optimistic update
      setParticipants(prev =>
        prev.map(x => (x.id === p.id ? { ...x, status: newStatus } : x))
      );
    } catch (e: any) {
      setErr(e?.message || t('program_participants_page.update_failed'));
    } finally {
      setUpdatingId(null);
    }
  };

  const ActionButtons = ({ p }: { p: ProgramParticipant }) => {
    const disabled = updatingId === p.id;

    if (p.status === 'pending') {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="success"
            disabled={disabled}
            onClick={() => handleSetStatus(p, 'joined')}
          >
            {t('program_participants_page.approve')}
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={disabled}
            onClick={() => handleSetStatus(p, 'rejected')}
          >
            {t('program_participants_page.reject')}
          </Button>
        </div>
      );
    }

    // Cho phép “Revert to pending” nếu đã joined hoặc rejected
    return (
      <Button
        size="sm"
        variant="secondary"
        disabled={disabled}
        onClick={() => handleSetStatus(p, 'pending')}
      >
        {t('program_participants_page.revert_pending')}
      </Button>
    );
  };

  const content = useMemo(() => {
    if (loading) return <div className="text-center py-10">Loading…</div>;
    if (err) return <div className="text-center py-3 text-red-600">{err}</div>;
    if (participants.length === 0)
      return <p className="text-gray-500">{t('program_participants_page.no_participants')}</p>;

    return (
      <>
        {/* DESKTOP TABLE */}
        <div className="bg-white rounded-xl shadow border overflow-hidden hidden md:block">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="p-3 text-left">{t('program_participants_page.name')}</th>
                <th className="p-3 text-left">{t('program_participants_page.phone')}</th>
                <th className="p-3 text-left">{t('program_participants_page.address')}</th>
                <th className="p-3 text-left">{t('program_participants_page.role')}</th>
                <th className="p-3 text-left">{t('program_participants_page.status')}</th>
                <th className="p-3 text-left">{t('program_participants_page.joined_at')}</th>
                <th className="p-3 text-left">{t('program_participants_page.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {participants.map((p) => {
                const agent = p.userRole === 'agent' ? agentByOwnerId[p.userId] : null;
                return (
                  <tr key={p.id} className="border-t">
                    <td className="p-3">{agent?.name || '—'}</td>
                    <td className="p-3">{agent?.phone || '—'}</td>
                    <td className="p-3">{(agent as any)?.displayAddress || '—'}</td>
                    <td className="p-3"><RoleBadge role={p.userRole as Role} /></td>
                    <td className="p-3"><StatusBadge status={p.status} /></td>
                    <td className="p-3">{fmtDate(p.joinedAt as any)}</td>
                    <td className="p-3">
                      <ActionButtons p={p} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARDS */}
        <div className="md:hidden space-y-4">
          {participants.map((p) => {
            const agent = p.userRole === 'agent' ? agentByOwnerId[p.userId] : null;
            return (
              <div key={p.id} className="border rounded-xl p-4 bg-white shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{agent?.name || '—'}</div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="text-sm text-gray-600">{agent?.phone || '—'}</div>
                <div className="text-sm text-gray-600">{(agent as any)?.displayAddress || '—'}</div>
                <div className="text-sm"><RoleBadge role={p.userRole as Role} /></div>
                <div className="text-xs text-gray-500">
                  {t('program_participants_page.joined_at')}: {fmtDate(p.joinedAt as any)}
                </div>
                <div className="pt-2">
                  <ActionButtons p={p} />
                </div>
              </div>
            );
          })}
        </div>
      </>
    );
  }, [loading, err, participants, agentByOwnerId, t, updatingId]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          👥 {t('program_participants_page.title')}
        </h1>
        {content}
      </main>
      <Footer />
    </div>
  );
}
