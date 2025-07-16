'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Ebike } from '@/src/lib/vehicles/vehicleTypes';
import { EbikeModel } from '@/src/lib/vehicleModels/vehicleModelTypes';

export function useEbikeDataByCompany(companyId: string | null) {
  const [ebikes, setEbikes] = useState<Ebike[]>([]);
  const [ebikeModels, setEbikeModels] = useState<EbikeModel[]>([]);

  useEffect(() => {
    if (!companyId) return;

    const fetchData = async () => {
      await Promise.all([
        fetchEbikeModels(companyId),
        fetchEbikes(companyId),
      ]);
    };

    fetchData();
  }, [companyId]);

  const fetchEbikes = async (companyId: string) => {
    const q = query(collection(db, 'ebikes'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Ebike, 'id'>),
    }));
    setEbikes(list);
  };

  const fetchEbikeModels = async (companyId: string) => {
    const q = query(collection(db, 'ebikeModels'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<EbikeModel, 'id'>),
    }));
    setEbikeModels(list);
  };

  return {
    ebikes,
    setEbikes,
    ebikeModels,
    setEbikeModels,
  };
}
