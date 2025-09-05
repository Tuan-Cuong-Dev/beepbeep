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
  documentId, // 👈 dùng để query theo danh sách ID
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
  modelDiscounts?: Record<string, string>; // modelId -> price/discount (string/number)
  stationIds?: string[];
  startDate: any;
  endDate: any;
  isActive: boolean;
}

// Chunk mảng cho where(documentId(), 'in', [...]) (Firestore giới hạn 10 phần tử)
const chunk = <T,>(arr: T[], size = 10): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// ===== Helpers: tolerant location parsing =====
function toLatLng(input: any): { latitude: number; longitude: number } | null {
  if (!input) return null;

  // unwrap { geo: ... }
  if (typeof input === 'object' && 'geo' in input) {
    return toLatLng((input as any).geo);
  }

  // Geo-like object (GeoPoint or plain)
  if (typeof input === 'object') {
    const lat =
      typeof (input as any).latitude === 'number'
        ? (input as any).latitude
        : typeof (input as any)._lat === 'number'
        ? (input as any)._lat
        : typeof (input as any).lat === 'number'
        ? (input as any).lat
        : undefined;

    const lng =
      typeof (input as any).longitude === 'number'
        ? (input as any).longitude
        : typeof (input as any)._long === 'number'
        ? (input as any)._long
        : typeof (input as any).lng === 'number'
        ? (input as any).lng
        : typeof (input as any).lon === 'number'
        ? (input as any).lon
        : undefined;

    if (typeof lat === 'number' && typeof lng === 'number') {
      return { latitude: lat, longitude: lng };
    }
  }

  // "lat,lng" string
  if (typeof input === 'string') {
    const m = input.trim().match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/);
    if (m) {
      const lat = parseFloat(m[1]);
      const lng = parseFloat(m[3]);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { latitude: lat, longitude: lng };
      }
    }
  }

  return null;
}

function getEntityLatLng(entity: any): { latitude: number; longitude: number } | null {
  if (!entity) return null;
  return (
    toLatLng(entity.location?.geo) ||
    toLatLng(entity.location) ||
    toLatLng(entity.geo) ||
    toLatLng(entity)
  );
}

export default function ProgramDetailPage() {
  const { t } = useTranslation('common');
  const { user } = useUser();
  const params = useParams();
  const programId = params?.programId as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [company, setCompany] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [models, setModels] = useState<Record<string, string>>({});
  const [agent, setAgent] = useState<any>(null);
  const [joined, setJoined] = useState(false);

  const renderDistance = (station: any) => {
    const agentLoc = getEntityLatLng(agent);
    const stationLoc = getEntityLatLng(station);
    if (!agentLoc || !stationLoc) return null;
    const distance = getDistance(agentLoc, stationLoc); // meters
    return `${(distance / 1000).toFixed(1)} km`;
  };

  useEffect(() => {
    if (!programId || !user) return;

    const fetchData = async () => {
      // Program
      const programSnap = await getDoc(doc(db, 'programs', programId));
      if (!programSnap.exists()) return;
      const programData = { id: programSnap.id, ...programSnap.data() } as Program;
      setProgram(programData);

      // Company
      if (programData.companyId) {
        const companySnap = await getDoc(doc(db, 'rentalCompanies', programData.companyId));
        if (companySnap.exists()) setCompany(companySnap.data());
      }

      // ==== Vehicle models: luôn map ID -> name theo danh sách trong program.modelDiscounts
      let modelsMap: Record<string, string> = {};
      const discountIds = programData.modelDiscounts ? Object.keys(programData.modelDiscounts) : [];

      if (discountIds.length > 0) {
        const batches = chunk(discountIds, 10);
        const results: Record<string, string> = {};
        for (const ids of batches) {
          const snap = await getDocs(
            query(collection(db, 'vehicleModels'), where(documentId(), 'in', ids))
          );
          snap.docs.forEach((d) => {
            const data = d.data() as any;
            if (data?.name) results[d.id] = data.name;
          });
        }
        modelsMap = results;
      } else if (programData.companyId) {
        // (Fallback) nếu không có discount list thì map toàn bộ model theo company
        const modelsSnap = await getDocs(
          query(collection(db, 'vehicleModels'), where('companyId', '==', programData.companyId))
        );
        modelsMap = modelsSnap.docs.reduce((acc, d) => {
          acc[d.id] = (d.data() as any).name;
          return acc;
        }, {} as Record<string, string>);
      }
      setModels(modelsMap);

      // Stations of the company
      if (programData.companyId) {
        const stationsSnap = await getDocs(
          query(collection(db, 'rentalStations'), where('companyId', '==', programData.companyId))
        );
        setStations(stationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } else {
        setStations([]);
      }

      // Agent (current user)
      const agentSnap = await getDocs(
        query(collection(db, 'agents'), where('ownerId', '==', user.uid))
      );
      if (!agentSnap.empty) setAgent(agentSnap.docs[0].data());

      // Joined status
      const joinedSnap = await getDocs(
        query(
          collection(db, 'programParticipants'),
          where('programId', '==', programId),
          where('userId', '==', user.uid)
        )
      );
      if (!joinedSnap.empty) setJoined(true);
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

  if (!program) return null;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">🎯 {program.title}</h1>

        <p className="text-gray-600">
          {t('program_detail_page.active_until', {
            date: program.endDate?.toDate?.()?.toLocaleDateString(),
          })}
        </p>

        <div className="space-y-3 text-gray-700">
          <p>
            {t('program_detail_page.period', {
              start: program.startDate?.toDate?.()?.toLocaleDateString(),
              end: program.endDate?.toDate?.()?.toLocaleDateString(),
            })}
          </p>

          {company && (
            <p>
              {t('program_detail_page.company_info', {
                name: (company as any)?.name,
                email: (company as any)?.email || 'N/A',
              })}
            </p>
          )}

          {program.modelDiscounts && (
            <>
              <p>{t('program_detail_page.discount_models')}</p>
              <ul className="list-disc ml-6">
                {Object.entries(program.modelDiscounts).map(([modelId, price]) => {
                  const name = models[modelId];
                  if (!name) return null; // 👈 KHÔNG hiển thị ID khi không tìm được tên
                  return (
                    <li key={modelId}>
                      {name}: {formatCurrency(price)}
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {stations.length > 0 && (
            <>
              <p>{t('program_detail_page.stations_applied')}</p>
              <ul className="list-disc ml-6">
                {stations.map((station) => {
                  const dist = renderDistance(station);
                  return (
                    <li key={station.id}>
                      {station.name} {dist ? `(${dist})` : ''}
                    </li>
                  );
                })}
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
