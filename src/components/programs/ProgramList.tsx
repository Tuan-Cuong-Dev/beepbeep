'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import Link from 'next/link';
import { Button } from '@/src/components/ui/button';
import { Plus } from 'lucide-react';

interface Program {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export default function ProgramList() {
  const { user } = useUser();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrograms = async () => {
      if (!user?.uid) return;

      const companySnap = await getDocs(
        query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
      );

      if (!companySnap.empty) {
        const companyId = companySnap.docs[0].id;

        const programSnap = await getDocs(
          query(collection(db, 'programs'), where('companyId', '==', companyId))
        );

        const programList: Program[] = programSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Program[];

        setPrograms(programList);
      }

      setLoading(false);
    };

    fetchPrograms();
  }, [user]);

  if (loading) return <div className="text-center py-10">Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-10 space-y-6 max-w-5xl mx-auto">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">📋 Programs</h1>
          <Link href="/dashboard/programs/new">
            <Button className="flex items-center gap-2">
              <Plus size={16} />
              New Program
            </Button>
          </Link>
        </div>

        {programs.length === 0 ? (
          <p className="text-gray-600">No programs found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {programs.map(program => (
              <div key={program.id} className="bg-white p-4 rounded-xl shadow border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">{program.name}</h2>
                <p className="text-gray-600">{program.description}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {program.startDate} - {program.endDate}
                </p>
                <Link href={`/dashboard/programs/${program.id}`}>
                  <Button variant="outline" className="mt-4">View Details</Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
