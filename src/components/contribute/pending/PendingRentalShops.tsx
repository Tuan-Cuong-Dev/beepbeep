'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';

interface RentalStation {
  id: string;
  name: string;
  displayAddress: string;
  location: string;
  vehicleType: string;
  rejected?: boolean;
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
    const data: RentalStation[] = snap.docs
      .map((doc) => {
        const station = { ...doc.data(), id: doc.id } as RentalStation;
        console.log('📦 Rental Station:', station);
        return station;
      })
      .filter((s) => s.rejected !== true); // lọc rejected phía client

    setStations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'rentalStations', id), {
      status: 'active',
      rejected: false,
      updatedAt: Timestamp.now(),
    });
    fetchStations();
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, 'rentalStations', id), {
      status: 'inactive',
      rejected: true,
      updatedAt: Timestamp.now(),
    });
    fetchStations();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">🛠️ Pending Rental Shops</h2>
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : stations.length === 0 ? (
        <p className="text-center text-gray-500">No pending rental shops.</p>
      ) : (
        stations.map((s) => (
          <div
            key={s.id}
            className="border p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
          >
            <div>
              <p className="font-semibold text-lg">{s.name}</p>
              <p className="text-sm text-gray-600">{s.displayAddress}</p>
              <p className="text-sm">Vehicle Type: {s.vehicleType}</p>
              <p className="text-xs text-gray-400">Location: {s.location}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => handleApprove(s.id)} variant="default">
                Approve
              </Button>
              <Button onClick={() => handleReject(s.id)} variant="destructive">
                Reject
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
