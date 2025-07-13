'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { PersonalVehicle_new } from '@/src/lib/personalVehicles/personalVehiclesTypes_new';
import { useAuth } from './useAuth';

export function useUserPersonalVehicles() {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState<PersonalVehicle_new[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetchVehicles = async () => {
      try {
        const q = query(
          collection(db, 'personalVehicles'),
          where('userId', '==', currentUser.uid)
        );
        const snapshot = await getDocs(q);
        const list: PersonalVehicle_new[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<PersonalVehicle_new, 'id'>),
        }));
        setVehicles(list);
      } catch (error) {
        console.error('Error fetching personal vehicles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [currentUser?.uid]);

  return { vehicles, loading };
}
