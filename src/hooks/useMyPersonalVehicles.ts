import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';
import { PersonalVehicle_new } from '@/src/lib/personalVehicles/personalVehiclesTypes_new';

export function useMyPersonalVehicles() {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<PersonalVehicle_new[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!currentUser) return;
      const q = query(
        collection(db, 'personalVehicles'),
        where('userId', '==', currentUser.uid)
      );
      const snapshot = await getDocs(q);
      const result: PersonalVehicle_new[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PersonalVehicle_new[];
      setVehicles(result);
      setLoading(false);
    }

    fetch();
  }, [currentUser]);

  return { vehicles, loading };
}
