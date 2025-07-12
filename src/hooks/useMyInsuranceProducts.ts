import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/hooks/useAuth';

interface Insurance {
  id: string;
  name: string;
  packageCode: string;
  imageUrl?: string;
  expiredAt?: string | Date;
}

export function useMyInsuranceProducts() {
  const { currentUser } = useAuth();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    const fetch = async () => {
      try {
        const ref = collection(db, 'insurancePurchases');
        const q = query(ref, where('userId', '==', currentUser.uid));
        const snapshot = await getDocs(q);

        const data: Insurance[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.productName,
            packageCode: d.packageCode,
            imageUrl: d.imageUrl,
            expiredAt: d.expiredAt?.toDate?.() ?? null,
          };
        });

        setInsurances(data);
      } catch (error) {
        console.error('Failed to fetch insurance:', error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [currentUser?.uid]);

  return { insurances, loading };
}
