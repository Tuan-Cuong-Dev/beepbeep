'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { ProgramParticipant } from '@/src/lib/programs/rental-programs/programsType';
import { User, UserCheck, UserX } from 'lucide-react';
import { Agent } from '@/src/lib/agents/agentTypes';
import { useTranslation } from 'react-i18next';

export default function ProgramParticipantsPage() {
  const { t } = useTranslation('common');
  const params = useParams();
  const programId = params?.programId as string;

  const [participants, setParticipants] = useState<ProgramParticipant[]>([]);
  const [agentMap, setAgentMap] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!programId) return;

    const fetchData = async () => {
      const snap = await getDocs(query(collection(db, 'programParticipants'), where('programId', '==', programId)));
      const participantsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ProgramParticipant));
      setParticipants(participantsList);

      const agentIds = participantsList
        .filter(p => p.userRole === 'agent')
        .map(p => p.userId);

      if (agentIds.length > 0) {
        const agentsSnap = await getDocs(collection(db, 'agents'));
        const agents = agentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Agent));
        const map = agents.reduce((acc, agent) => {
          acc[agent.ownerId] = agent;
          return acc;
        }, {} as Record<string, Agent>);
        setAgentMap(map);
      }
    };

    fetchData();
  }, [programId]);

  const renderStatus = (status: string) => {
    switch (status) {
      case 'joined':
        return <span className="text-green-600 font-semibold">✅ {t('program_participants_page.status_joined')}</span>;
      case 'pending':
        return <span className="text-yellow-500 font-semibold">⏳ {t('program_participants_page.status_pending')}</span>;
      case 'rejected':
        return <span className="text-red-500 font-semibold">❌ {t('program_participants_page.status_rejected')}</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const renderRole = (role: string) => {
    switch (role) {
      case 'agent':
        return <span className="flex items-center gap-1"><User className="w-4 h-4" /> {t('program_participants_page.role_agent')}</span>;
      case 'customer':
        return <span className="flex items-center gap-1"><UserCheck className="w-4 h-4" /> {t('program_participants_page.role_customer')}</span>;
      case 'staff':
        return <span className="flex items-center gap-1"><UserX className="w-4 h-4" /> {t('program_participants_page.role_staff')}</span>;
      default:
        return <span>{role}</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          👥 {t('program_participants_page.title')}
        </h1>

        {participants.length === 0 ? (
          <p className="text-gray-500">{t('program_participants_page.no_participants')}</p>
        ) : (
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
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => {
                    const agent = p.userRole === 'agent' ? agentMap[p.userId] : null;

                    return (
                      <tr key={p.id} className="border-t">
                        <td className="p-3">{agent?.name || '-'}</td>
                        <td className="p-3">{agent?.phone || '-'}</td>
                        <td className="p-3">{agent?.displayAddress || '-'}</td>
                        <td className="p-3">{renderRole(p.userRole)}</td>
                        <td className="p-3">{renderStatus(p.status)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARDS */}
            <div className="md:hidden space-y-4">
              {participants.map((p) => {
                const agent = p.userRole === 'agent' ? agentMap[p.userId] : null;
                return (
                  <div key={p.id} className="border rounded-xl p-4 bg-white shadow-sm space-y-2">
                    <div><strong>{t('program_participants_page.name')}:</strong> {agent?.name || '-'}</div>
                    <div><strong>{t('program_participants_page.phone')}:</strong> {agent?.phone || '-'}</div>
                    <div><strong>{t('program_participants_page.address')}:</strong> {agent?.displayAddress || '-'}</div>
                    <div><strong>{t('program_participants_page.role')}:</strong> {renderRole(p.userRole)}</div>
                    <div><strong>{t('program_participants_page.status')}:</strong> {renderStatus(p.status)}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
