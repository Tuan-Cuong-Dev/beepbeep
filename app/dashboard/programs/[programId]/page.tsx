'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { useParams } from 'next/navigation';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { getDistance } from 'geolib';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/src/utils/formatCurrency';

interface Program {
  id: string;
  title: string;
  description: string;
  companyId?: string;
  modelDiscounts?: Record<string, string>;
  stationIds?: string[];
  startDate: any;
  endDate: any;
  isActive: boolean;
}

export default function ProgramDetailPage() {
  const { t } = useTranslation('common');
  const { user, role } = useUser();
  const params = useParams();
  const programId = params?.programId as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [models, setModels] = useState<any>({});
  const [agent, setAgent] = useState<any>(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (!programId || !user) return;

    const fetchData = async () => {
      const programSnap = await getDoc(doc(db, 'programs', programId));
      if (!programSnap.exists()) return;

      const programData = { id: programSnap.id, ...programSnap.data() } as Program;
      setProgram(programData);

      if (programData.companyId) {
        const companySnap = await getDoc(doc(db, 'rentalCompanies', programData.companyId));
        if (companySnap.exists()) {
          setCompany(companySnap.data());
        }
      }

      const modelsSnap = await getDocs(query(collection(db, 'ebikeModels'), where('companyId', '==', programData.companyId)));
      const modelsMap = modelsSnap.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data().name;
        return acc;
      }, {} as Record<string, string>);
      setModels(modelsMap);

      const stationsSnap = await getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', programData.companyId)));
      setStations(stationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const agentSnap = await getDocs(query(collection(db, 'agents'), where('ownerId', '==', user.uid)));
      if (!agentSnap.empty) {
        setAgent(agentSnap.docs[0].data());
      }

      const joinedSnap = await getDocs(query(collection(db, 'programParticipants'), where('programId', '==', programId), where('userId', '==', user.uid)));
      if (!joinedSnap.empty) {
        setJoined(true);
      }
    };

    fetchData();
  }, [programId, user]);

  const handleJoin = async () => {
    if (!user || joined) return;

    await addDoc(collection(db, 'programParticipants'), {
      programId,
      userId: user.uid,
      userRole: 'agent',
      status: 'joined',
      joinedAt: serverTimestamp(),
    });

    setJoined(true);
  };

  const parseLocation = (location: string) => {
    const [latStr, lngStr] = location.split(',');
    return {
      latitude: parseFloat(latStr),
      longitude: parseFloat(lngStr),
    };
  };

  const renderDistance = (station: any) => {
    if (!agent?.location || !station.location) return null;
    const agentLoc = parseLocation(agent.location);
    const stationLoc = parseLocation(station.location);
    const distance = getDistance(agentLoc, stationLoc);
    return `${(distance / 1000).toFixed(1)} km`;
  };

  if (!program) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">🎯 {program.title}</h1>
        <p className="text-gray-600">
          {t('program_detail_page.active_until', { date: program.endDate?.toDate?.().toLocaleDateString() })}
        </p>

        <div className="space-y-3 text-gray-700">
          <p>
            {t('program_detail_page.period', {
              start: program.startDate?.toDate?.().toLocaleDateString(),
              end: program.endDate?.toDate?.().toLocaleDateString(),
            })}
          </p>

          {company && (
            <p>{t('program_detail_page.company_info', { name: company.name, email: company.email || 'N/A' })}</p>
          )}

          {program.modelDiscounts && (
            <>
              <p>{t('program_detail_page.discount_models')}</p>
              <ul className="list-disc ml-6">
                {Object.entries(program.modelDiscounts).map(([modelId, price]) => (
                  <li key={modelId}>
                    {models[modelId] || modelId}: {formatCurrency(price)}
                  </li>
                ))}
              </ul>
            </>
          )}

          {stations.length > 0 && (
            <>
              <p>{t('program_detail_page.stations_applied')}</p>
              <ul className="list-disc ml-6">
                {stations.map(station => (
                  <li key={station.id}>
                    {station.name} {renderDistance(station) && `(${renderDistance(station)})`}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          {joined ? (
            <p className="text-green-600 font-semibold">
              {t('program_detail_page.already_joined')}
            </p>
          ) : (
            <Button onClick={handleJoin}>{t('program_detail_page.join_button')}</Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}