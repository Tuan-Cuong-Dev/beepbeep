'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';

interface BatteryStation {
  id: string;
  name: string;
  displayAddress: string;
  location: string;
  vehicleType: string;
  [key: string]: any;
}

export default function PendingBatteryStations() {
  const [stations, setStations] = useState<BatteryStation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = async () => {
    const q = query(
      collection(db, 'batteryStations'),
      where('isActive', '==', false),
      where('rejected', '!=', true)
    );
    const snap = await getDocs(q);
    const data: BatteryStation[] = snap.docs.map((doc) => ({
      ...(doc.data() as BatteryStation),
      id: doc.id,
    }));
    setStations(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchStations();
  }, []);

  const handleApprove = async (id: string) => {
    await updateDoc(doc(db, 'batteryStations', id), {
      isActive: true,
      rejected: false,
      updatedAt: new Date(),
    });
    fetchStations();
  };

  const handleReject = async (id: string) => {
    await updateDoc(doc(db, 'batteryStations', id), {
      rejected: true,
      updatedAt: new Date(),
    });
    fetchStations();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Pending Battery Stations</h2>
      {loading ? (
        <p>Loading...</p>
      ) : stations.length === 0 ? (
        <p>No pending battery stations.</p>
      ) : (
        stations.map((s) => (
          <div
            key={s.id}
            className="border p-4 rounded shadow flex flex-col md:flex-row justify-between items-start md:items-center"
          >
            <div className="mb-2 md:mb-0">
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-gray-500">{s.displayAddress}</p>
              <p className="text-sm">Vehicle Type: {s.vehicleType}</p>
              <p className="text-xs text-gray-400">Location: {s.location}</p>
            </div>
            <div className="flex gap-2 mt-2 md:mt-0">
              <Button onClick={() => handleApprove(s.id)}>Approve</Button>
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
