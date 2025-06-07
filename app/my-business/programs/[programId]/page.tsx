'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/src/context/AuthContext';
import { useParams } from 'next/navigation';
import { collection, doc, getDoc, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { getDistance } from 'geolib';

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

      // Company
      if (programData.companyId) {
        const companySnap = await getDoc(doc(db, 'rentalCompanies', programData.companyId));
        if (companySnap.exists()) {
          setCompany(companySnap.data());
        }
      }

      // Models
      const modelsSnap = await getDocs(query(collection(db, 'ebikeModels'), where('companyId', '==', programData.companyId)));
      const modelsMap = modelsSnap.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data().name;
        return acc;
      }, {} as Record<string, string>);
      setModels(modelsMap);

      // Stations
      const stationsSnap = await getDocs(query(collection(db, 'rentalStations'), where('companyId', '==', programData.companyId)));
      setStations(stationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Agent
      const agentSnap = await getDocs(query(collection(db, 'agents'), where('ownerId', '==', user.uid)));
      if (!agentSnap.empty) {
        setAgent(agentSnap.docs[0].data());
      }

      // Check join
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
        <p className="text-gray-600">Áp dụng đến hết ngày {program.endDate?.toDate?.().toLocaleDateString()}</p>

        <div className="space-y-3 text-gray-700">
          <p>📅 <strong>Period:</strong> {program.startDate?.toDate?.().toLocaleDateString()} → {program.endDate?.toDate?.().toLocaleDateString()}</p>

          {company && (
            <p>🏢 <strong>Company:</strong> {company.name} ({company.email || 'No email'})</p>
          )}

          {program.modelDiscounts && (
            <>
              <p>🚲 <strong>Discount Models:</strong></p>
              <ul className="list-disc ml-6">
                {Object.entries(program.modelDiscounts).map(([modelId, price]) => (
                  <li key={modelId}>{models[modelId] || modelId}: {price} VND</li>
                ))}
              </ul>
            </>
          )}

          {stations.length > 0 && (
            <>
              <p>📍 <strong>Stations áp dụng:</strong></p>
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
            <p className="text-green-600 font-semibold">✅ Bạn đã tham gia chương trình này</p>
          ) : (
            <Button onClick={handleJoin}>Join Program</Button>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
