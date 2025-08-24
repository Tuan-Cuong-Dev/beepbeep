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
  rejected?: boolean;
  [key: string]: any;
}

export default function PendingTechnicianPartners() {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTechnicians = async () => {
    const q = query(
      collection(db, 'technicianPartners'),
      where('isActive', '==', false)
    );
    const snap = await getDocs(q);
    const data: Technician[] = snap.docs
      .map((doc) => ({ ...doc.data(), id: doc.id } as Technician))
      .filter((tech) => tech.rejected !== true);
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
      isActive: false,
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
          <div>
            <p className="font-semibold">{tech.name}</p>
            <p className="text-sm text-gray-500">{tech.phone || '—'}</p>

            {/* Địa chỉ cửa hàng */}
            <p className="text-sm text-gray-600">
              🏠 Địa chỉ: {tech.shopAddress || '—'}
            </p>

            {/* Tọa độ (latitude, longitude) */}
            <p className="text-sm text-gray-600">
              📍 Tọa độ:{' '}
              {tech.coordinates
                ? `${tech.coordinates.lat}, ${tech.coordinates.lng}`
                : '—'}
            </p>

            {/* Loại phương tiện */}
              <p className="text-xs text-gray-400">
                🛠 Vehicle Type: {tech.vehicleType ? tech.vehicleType : '—'}
              </p>
          </div>

            <div className="flex gap-2 mt-2 md:mt-0">
              <Button onClick={() => handleApprove(tech.id)} variant="default">
                Approve
              </Button>
              <Button onClick={() => handleReject(tech.id)} variant="destructive">
                Reject
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}