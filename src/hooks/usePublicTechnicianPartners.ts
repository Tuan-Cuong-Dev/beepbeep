// hooks/usePublicTechnicianPartners.ts
// ạo Hook chỉ fetch các TechnicianPartner đang hoạt động (isActive = true)
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
      const data = snap.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as TechnicianPartner[];
      setPartners(data);
      setLoading(false);
    };

    fetch();
  }, []);

  return { partners, loading };
}

