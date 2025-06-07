import { useEffect, useState } from 'react';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export function useCurrentCompanyId() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();
        if (userData?.companyId) {
          setCompanyId(userData.companyId);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe(); // cleanup listener
  }, []);

  return { companyId, loading };
}
