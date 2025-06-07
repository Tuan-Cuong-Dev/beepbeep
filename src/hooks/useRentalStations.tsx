'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';

export function useRentalStations(companyId: string, isAdmin = false) {
  const [stations, setStations] = useState<RentalStation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStations = async () => {
      try {
        let q;
        if (isAdmin) {
          // Admin thì lấy tất cả các stations
          q = query(collection(db, 'rentalStations'));
        } else {
          // Công ty thường thì lọc theo companyId
          q = query(collection(db, 'rentalStations'), where('companyId', '==', companyId));
        }

        const snapshot = await getDocs(q);
        const data: RentalStation[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<RentalStation, 'id'>),
        }));

        setStations(data);
      } catch (error) {
        console.error('❌ Failed to fetch rental stations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (companyId || isAdmin) {
      fetchStations();
    }
  }, [companyId, isAdmin]);

  return { stations, loading };
}
