// src/hooks/usePersonalVehicles.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { PersonalVehicle } from '@/src/lib/personalVehicles/personalVehiclesTypes';

export function usePersonalVehicles(userId?: string) {
  const [vehicles, setVehicles] = useState<PersonalVehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVehicles = useCallback(async () => {
    if (!userId) {
      setVehicles([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'personalVehicles'), where('userId', '==', userId));
      const snap = await getDocs(q);

      const list = snap.docs.map((docSnap) => {
        // Quan trọng: loại bỏ 'id' trong data để không đè lên doc.id
        const data = docSnap.data() as Omit<PersonalVehicle, 'id'>;
        return { id: docSnap.id, ...data } as PersonalVehicle;
      });

      setVehicles(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return { vehicles, loading, error, refresh: fetchVehicles };
}
