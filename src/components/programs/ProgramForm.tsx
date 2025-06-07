'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { db } from '@/src/firebaseConfig';
import { collection, doc, getDoc, getDocs, query, where, setDoc, updateDoc } from 'firebase/firestore';
import { useUser } from '@/src/context/AuthContext';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';

export default function ProgramForm() {
  const { user } = useUser();
  const router = useRouter();
  const params = useParams();
  const programId = params?.id as string | undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProgram = async () => {
      if (programId) {
        const docRef = doc(db, 'programs', programId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setDescription(data.description);
          setStartDate(data.startDate);
          setEndDate(data.endDate);
        }
      }
    };

    fetchProgram();
  }, [programId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!user?.uid) return;

    const companySnap = await getDocs(
      query(collection(db, 'rentalCompanies'), where('ownerId', '==', user.uid))
    );

    if (!companySnap.empty) {
      const companyId = companySnap.docs[0].id;

      const programData = {
        name,
        description,
        startDate,
        endDate,
        companyId,
      };

      if (programId) {
        await updateDoc(doc(db, 'programs', programId), programData);
      } else {
        const newDocRef = doc(collection(db, 'programs'));
        await setDoc(newDocRef, programData);
      }

      router.push('/my-business/programs');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-6 py-10 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          {programId ? 'Edit Program' : 'New Program'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Program Name</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
          </div>

          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Program'}
          </Button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
