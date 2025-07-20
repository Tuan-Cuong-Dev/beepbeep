'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { ContributionType } from '@/src/lib/contributions/contributionTypes';

export interface UserContribution {
  id: string;
  type: ContributionType;
  name: string;
  address: string;
  createdAt: Timestamp | null;
  status: 'approved' | 'pending';
}

export function useUserContributions(uid?: string) {
  const [contributions, setContributions] = useState<UserContribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;

    const fetchContributions = async () => {
      setLoading(true);
      const all: UserContribution[] = [];

      const fetchFrom = async (
        colName: string,
        type: ContributionType,
        mapData: (d: any) => Partial<UserContribution>
      ) => {
        const q = query(collection(db, colName), where('createdBy', '==', uid));
        const snap = await getDocs(q);
        snap.forEach((doc) => {
          const data = mapData(doc.data());
          all.push({
            id: doc.id,
            type,
            name: data.name ?? '—',
            address: data.address ?? '—',
            createdAt: data.createdAt ?? null,
            status: data.status ?? 'pending',
          });
        });
      };

      await fetchFrom('technicianPartners', 'repair_shop', (d) => ({
        name: d.shopName || d.name,
        address: d.shopAddress,
        createdAt: d.createdAt,
        status: d.isActive ? 'approved' : 'pending',
      }));

      await fetchFrom('rentalStations', 'rental_shop', (d) => ({
        name: d.name,
        address: d.displayAddress,
        createdAt: d.createdAt,
        status: 'pending',
      }));

      await fetchFrom('batteryStations', 'battery_station', (d) => ({
        name: d.name,
        address: d.displayAddress,
        createdAt: d.createdAt,
        status: d.isActive ? 'approved' : 'pending',
      }));

      const sorted = all.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });

      setContributions(sorted);
      setLoading(false);
    };

    fetchContributions();
  }, [uid]);

  return { contributions, loading };
}
