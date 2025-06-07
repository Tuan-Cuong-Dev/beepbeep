'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Ebike } from '@/src/lib/ebikes/ebikeTypes';
import { EbikeModel } from '@/src/lib/ebikemodels/ebikeModelTypes';

interface UseEbikeDataOptions {
  companyId?: string;
  isAdmin?: boolean;
}

export function useEbikeData({ companyId = '', isAdmin = false }: UseEbikeDataOptions) {
  const [ebikes, setEbikes] = useState<Ebike[]>([]);
  const [ebikeModels, setEbikeModels] = useState<EbikeModel[]>([]);

  const fetchEbikes = async () => {
    let q;
    if (isAdmin) {
      q = query(collection(db, 'ebikes'));
    } else {
      q = query(collection(db, 'ebikes'), where('companyId', '==', companyId));
    }
    const snapshot = await getDocs(q);
    const data: Ebike[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Ebike, 'id'>),
    }));
    setEbikes(data);
  };

  const fetchModels = async () => {
    let q;
    if (isAdmin) {
      q = query(collection(db, 'ebikeModels'));
    } else {
      q = query(collection(db, 'ebikeModels'), where('companyId', '==', companyId));
    }
    const snapshot = await getDocs(q);
    const data: EbikeModel[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<EbikeModel, 'id'>),
    }));
    setEbikeModels(data);
  };

  useEffect(() => {
    if (isAdmin || companyId) {
      fetchEbikes();
      fetchModels();
    }
  }, [companyId, isAdmin]);

  return {
    ebikes,
    setEbikes,
    ebikeModels,
    setEbikeModels,
  };
}
