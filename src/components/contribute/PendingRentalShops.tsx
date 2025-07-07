'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';

interface RentalStation {
  id: string;
  name: string;
  displayAddress: string;
  location: string;
  vehicleType: string;
  [key: string]: any;
}

export default function PendingRentalShops() {
  const [stations, setStations] = useState<RentalStation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = async () => {
    const q = query(
      collection(db, 'rentalStations'),
      where('companyId', '==', 'contributed'),
      where('status', '==', 'inactive')
    );
    const snap = await getDocs(q);
    const data: RentalStation[] = snap.docs.map((doc) => {
      const raw = doc.data() as RentalStation;
      return {
        ...raw,
        id: doc.id,
      };
    });
    setStations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'rentalStations', id), {
      status: 'active',
      updatedAt: new Date(),
    });
    fetchStations();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Pending Rental Shops</h2>
      {loading ? (
        <p>Loading...</p>
      ) : stations.length === 0 ? (
        <p>No pending rental shops.</p>
      ) : (
        stations.map((s) => (
          <div
            key={s.id}
            className="border p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div>
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-gray-500">{s.displayAddress}</p>
              <p className="text-sm">Vehicle Type: {s.vehicleType}</p>
              <p className="text-xs text-gray-400">Location: {s.location}</p>
            </div>
            <Button onClick={() => handleApprove(s.id)} className="mt-2 md:mt-0">
              Approve
            </Button>
          </div>
        ))
      )}
    </div>
  );
}
