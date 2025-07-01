'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Ebike } from '@/src/lib/ebikes/ebikeTypes';
import { EbikeModel } from '@/src/lib/ebikemodels/ebikeModelTypes';
import { useUser } from '@/src/context/AuthContext';

interface UseEbikeDataOptions {
  companyId?: string;
  stationId?: string;
  isAdmin?: boolean;
}

export function useEbikeData({ companyId = '' }: UseEbikeDataOptions = {}) {
  const { role } = useUser();

  // 👇 Tự động xác định nếu có quyền truy cập toàn hệ thống
  const isGlobalAccess = role === 'Admin' || role === 'technician_assistant';

  const [ebikes, setEbikes] = useState<Ebike[]>([]);
  const [ebikeModels, setEbikeModels] = useState<EbikeModel[]>([]);

  const fetchEbikes = async () => {
    const q = isGlobalAccess
      ? query(collection(db, 'ebikes'))
      : query(collection(db, 'ebikes'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const data: Ebike[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Ebike, 'id'>),
    }));
    setEbikes(data);
  };

  const fetchModels = async () => {
    const q = isGlobalAccess
      ? query(collection(db, 'ebikeModels'))
      : query(collection(db, 'ebikeModels'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const data: EbikeModel[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<EbikeModel, 'id'>),
    }));
    setEbikeModels(data);
  };

  useEffect(() => {
    if (isGlobalAccess || companyId) {
      fetchEbikes();
      fetchModels();
    }
  }, [companyId, isGlobalAccess]);

  return {
    ebikes,
    setEbikes,
    ebikeModels,
    setEbikeModels,
  };
}
