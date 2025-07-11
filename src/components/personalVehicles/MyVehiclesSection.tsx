'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { PersonalVehicle_new } from '@/src/lib/personalVehicles/personalVehiclesTypes_new';
import { useAuth } from '@/src/hooks/useAuth';
import { Button } from '@/src/components/ui/button';
import SelectModelThenAddVehicleForm from '@/src/components/personalVehicles/SelectModelThenAddVehicleForm';

export default function MyVehiclesSection() {
  const { currentUser, loading } = useAuth(); // ✅ dùng currentUser như trong hook của bạn
  const [vehicles, setVehicles] = useState<PersonalVehicle_new[]>([]);
  const [showForm, setShowForm] = useState(false);

  const fetchVehicles = async () => {
    if (!currentUser?.uid) return;
    const q = query(collection(db, 'personalVehicles'), where('userId', '==', currentUser.uid));
    const snap = await getDocs(q);
    const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as PersonalVehicle_new));
    setVehicles(list);
  };

  useEffect(() => {
    if (!loading) fetchVehicles();
  }, [currentUser, loading]);

  const handleVehicleAdded = () => {
    setShowForm(false);
    fetchVehicles();
  };

  return (
    <section className="space-y-4 px-4 md:px-0">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">🚗 My Vehicles</h2>
        <Button variant="outline" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Close' : '+ Add Vehicle'}
        </Button>
      </div>

      {showForm && <SelectModelThenAddVehicleForm onSaved={handleVehicleAdded} />}
    </section>
  );
}
