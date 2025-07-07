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

interface BatteryStation {
  id: string;
  name: string;
  displayAddress: string;
  location: string;
  vehicleType: string;
  rejected?: boolean;
  [key: string]: any;
}

export default function PendingBatteryStations() {
  const [stations, setStations] = useState<BatteryStation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStations = async () => {
    const q = query(collection(db, 'batteryStations'), where('isActive', '==', false));
    const snap = await getDocs(q);
    const data: BatteryStation[] = snap.docs
      .map((doc) => {
        const raw = doc.data() as BatteryStation;
        const station = { ...raw, id: doc.id };
        console.log('🔋 Battery Station:', station);
        return station;
      })
      .filter((s) => s.rejected !== true); // lọc phía client

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
      updatedAt: Timestamp.now(),
    });
    fetchStations();
  };

  const handleReject = async (id: string) => {
    setLoading(true);
    await updateDoc(doc(db, 'batteryStations', id), {
      isActive: false,
      rejected: true,
      updatedAt: Timestamp.now(),
    });
    fetchStations();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-center">🔋 Pending Battery Stations</h2>
      {loading ? (
        <p className="text-center text-gray-500">Loading...</p>
      ) : stations.length === 0 ? (
        <p className="text-center text-gray-500">No pending battery stations.</p>
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
