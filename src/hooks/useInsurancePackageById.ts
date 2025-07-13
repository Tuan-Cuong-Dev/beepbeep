// hooks/useInsurancePackageById.ts
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { InsurancePackage } from '@/src/lib/insurancePackages/insurancePackageTypes';

export function useInsurancePackageById(id?: string) {
  const [data, setData] = useState<InsurancePackage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const ref = doc(db, 'insurancePackages', id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setData({ id: snap.id, ...snap.data() } as InsurancePackage);
        } else {
          setData(null);
        }
      } catch (err) {
        console.error('❌ Failed to fetch package:', err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id]);

  return { currentPackage: data, loading };
}
