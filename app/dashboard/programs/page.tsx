'use client';

import { useEffect, useState } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { collection, getDocs, query, where, addDoc, serverTimestamp, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/button';
import Link from 'next/link';
import { Program } from '@/src/lib/programs/programsType';

export default function ProgramsPage() {
  const { user, role, companyId } = useUser();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [joinedPrograms, setJoinedPrograms] = useState<string[]>([]);

  const isAgent = role === 'agent';
  const isAdmin = role === 'Admin';
  const isCompanyOwner =
  role === 'company_owner' || role === 'private_provider' || role === 'company_admin' || role === 'station_manager'; // 👈 thêm dòng này;


  function normalizeProgram(raw: any, id: string): Program {
    return {
      id,
      title: raw.title,
      description: raw.description,
      type: raw.type,
      createdByUserId: raw.createdByUserId,
      createdByRole: raw.createdByRole,
      companyId: raw.companyId ?? null,
      stationTargets: raw.stationTargets ?? [],
      modelDiscounts: raw.modelDiscounts ?? [],
      startDate: raw.startDate instanceof Timestamp ? raw.startDate : null,
      endDate: raw.endDate instanceof Timestamp ? raw.endDate : null,
      isActive: raw.isActive ?? true,
      createdAt: raw.createdAt ?? Timestamp.now(),
      updatedAt: raw.updatedAt ?? Timestamp.now(),
    };
  }

  useEffect(() => {
    if (!user) return;

    const fetchPrograms = async () => {
      let q;

      if (isAgent) {
        // Agent thấy tất cả agent_program
        q = query(
          collection(db, 'programs'),
        );
      } else if (isCompanyOwner) {
        q = query(
          collection(db, 'programs'),
          where('type', '==', 'rental_program'),
          where('companyId', '==', companyId)
        );
      } else if (isAdmin) {
        q = collection(db, 'programs');
      } else {
        return;
      }

      const snap = await getDocs(q);
      const list = snap.docs.map(doc => normalizeProgram(doc.data(), doc.id));
      setPrograms(list);

      if (isAgent) {
        const joinedSnap = await getDocs(query(collection(db, 'programParticipants'), where('userId', '==', user.uid)));
        const joinedList = joinedSnap.docs.map(doc => doc.data().programId);
        setJoinedPrograms(joinedList);
      }
    };

    fetchPrograms();
  }, [user, role, companyId]);

  const handleJoin = async (programId: string) => {
    if (!user) return;
    await addDoc(collection(db, 'programParticipants'), {
      programId,
      userId: user.uid,
      userRole: role,
      status: 'joined',
      joinedAt: serverTimestamp(),
    });
    setJoinedPrograms(prev => [...prev, programId]);
  };

  const handleDelete = async (programId: string) => {
    await deleteDoc(doc(db, 'programs', programId));
    setPrograms(prev => prev.filter(p => p.id !== programId));
  };

  const renderStatus = (program: Program) => {
    const now = Timestamp.now();
    if (!program.isActive) return <span className="px-2 py-1 bg-gray-400 text-white rounded">Inactive</span>;
    if (!program.startDate || program.startDate.toMillis() > now.toMillis()) return <span className="px-2 py-1 bg-blue-500 text-white rounded">Upcoming</span>;
    if (!program.endDate || program.endDate.toMillis() < now.toMillis()) return <span className="px-2 py-1 bg-red-500 text-white rounded">Ended</span>;
    return <span className="px-2 py-1 bg-[#00d289] text-white rounded">Active</span>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-6 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-gray-800">🎯 Programs</h1>

        {(isCompanyOwner || isAdmin) && (
          <Link
            href="/dashboard/programs/new"
            className="inline-block bg-[#00d289] hover:bg-[#00b67a] text-white text-center font-medium px-4 py-3 rounded-xl transition"
          >
            ➕ Create New Program
          </Link>
        )}

        {programs.length === 0 ? (
          <p className="text-gray-500">No programs available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map(program => (
              <div key={program.id} className="bg-white rounded-xl shadow p-6 border space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-gray-800">
                    <Link href={`/dashboard/programs/${program.id}`} className="text-[#00d289] hover:underline">
                      {program.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600">{program.description}</p>
                  <div>{renderStatus(program)}</div>
                </div>

                <div className="space-y-2">
                  {isAgent && (
                    joinedPrograms.includes(program.id) ? (
                      <div className="text-green-600 font-medium">✅ Joined</div>
                    ) : (
                      <Button onClick={() => handleJoin(program.id)}>Join Program</Button>
                    )
                  )}

                  {(isCompanyOwner || isAdmin) && (
                    <div className="flex gap-2">
                      <Link 
                        href={`/dashboard/programs/${program.id}/participants`} 
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium px-4 py-2 rounded-md text-center transition"
                      >
                        View Participants
                      </Link>

                      <Button size ="sm" variant="destructive" onClick={() => handleDelete(program.id)}>
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
