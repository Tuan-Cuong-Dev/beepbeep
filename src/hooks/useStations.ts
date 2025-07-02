'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Station } from '@/src/lib/stations/stationTypes';

/** Parse geo từ location dạng chuỗi nếu geo chưa tồn tại */
function parseLocationString(location: string): { lat: number; lng: number } | null {
  const regex = /([-\d.]+)[°]?\s?[NS],\s*([-\d.]+)[°]?\s?[EW]/;
  const match = location?.match(regex);
  if (match && match[1] && match[2]) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return { lat, lng };
    }
  }
  return null;
}

export function useStations(companyId?: string) {
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseRef = collection(db, 'rentalStations');
    const q = companyId
      ? query(baseRef, where('companyId', '==', companyId))
      : baseRef;

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Station[] = snapshot.docs.map((docSnap) => {
          const raw = docSnap.data();
          const geo = raw.geo ?? parseLocationString(raw.location);

          return {
            id: docSnap.id,
            name: raw.name,
            companyId: raw.companyId,
            displayAddress: raw.displayAddress,
            mapAddress: raw.mapAddress,
            location: raw.location,
            geo,
            contactPhone: raw.contactPhone,
            status: raw.status ?? 'active',
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
          } satisfies Station;
        });

        setStations(data);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [companyId]);

  return {
    stations,
    loading,
    error,
  };
}
