'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

export function usePublicTechnicianPartners() {
  const [partners, setPartners] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const q = query(
        collection(db, 'technicianPartners'),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);

      const data: TechnicianPartner[] = snap.docs.map((doc) => {
        const raw = doc.data();

        let coordinates = raw.coordinates ?? raw.geo; // ✅ fallback
        if (typeof coordinates === 'string') {
          const [lat, lng] = coordinates.split(',').map(parseFloat);
          if (!isNaN(lat) && !isNaN(lng)) {
            coordinates = { lat, lng };
          } else {
            coordinates = undefined;
          }
        }

        return {
          ...(raw as TechnicianPartner),
          id: doc.id,
          coordinates, // ✅ key used in Marker
        };
      });

      setPartners(data);
      setLoading(false);
    };

    fetch();
  }, []);

  return { partners, loading };
}
