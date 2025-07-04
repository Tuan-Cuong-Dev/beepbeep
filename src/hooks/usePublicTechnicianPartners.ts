'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

export function usePublicTechnicianPartners() {
  const [partners, setPartners] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const q = query(
          collection(db, 'technicianPartners'),
          where('isActive', '==', true)
        );

        const snap = await getDocs(q);
        const data: TechnicianPartner[] = snap.docs.map((doc) => {
          const raw = doc.data();

          // Fallback: coordinates hoặc geo string
          let coordinates = raw.coordinates ?? raw.geo;

          if (typeof coordinates === 'string') {
            const [latStr, lngStr] = coordinates.split(',').map((s) => s.trim());
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);

            if (!isNaN(lat) && !isNaN(lng)) {
              coordinates = { lat, lng };
            } else {
              console.warn(`⚠️ Invalid coordinates string in technician ${doc.id}:`, coordinates);
              coordinates = undefined;
            }
          }

          return {
            ...(raw as TechnicianPartner),
            id: doc.id,
            coordinates,
          };
        });

        setPartners(data);
      } catch (error) {
        console.error('❌ Failed to fetch technician partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  return { partners, loading };
}
