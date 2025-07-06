'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';

interface Technician {
  id: string;
  name: string;
  contactPhone?: string;
  serviceCategories?: string[];
  [key: string]: any;
}

export default function PendingTechnicians() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTechnicians = async () => {
    const q = query(collection(db, 'technicianPartners'), where('isActive', '==', false), where('rejected', '!=', true));
    const snap = await getDocs(q);
    const data: Technician[] = snap.docs.map((doc) => {
      const raw = doc.data() as Technician;
      return {
        ...raw,
        id: doc.id,
      };
    });
    setTechnicians(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'technicianPartners', id), {
      isActive: true,
      rejected: false,
      updatedAt: new Date(),
    });
    fetchTechnicians();
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, 'technicianPartners', id), {
      rejected: true,
      updatedAt: new Date(),
    });
    fetchTechnicians();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Pending Technicians</h2>

      {loading ? (
        <p>Loading...</p>
      ) : technicians.length === 0 ? (
        <p>No pending technicians.</p>
      ) : (
        technicians.map((tech) => (
          <div
            key={tech.id}
            className="border p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div className="mb-2 md:mb-0">
              <p className="font-semibold">{tech.name}</p>
              <p className="text-sm text-gray-500">{tech.contactPhone || '—'}</p>
              <p className="text-xs text-gray-400">
                Categories: {(tech.serviceCategories || []).join(', ') || '—'}
              </p>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <Button variant="default" onClick={() => handleApprove(tech.id)}>
                Approve
              </Button>
              <Button variant="destructive" onClick={() => handleReject(tech.id)}>
                Reject
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
