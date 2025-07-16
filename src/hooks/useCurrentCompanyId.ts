import { useEffect, useState } from 'react';
import { auth, db } from '@/src/firebaseConfig';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export function useCurrentCompanyId() {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const uid = user.uid;

        // 1️⃣ Kiểm tra trong staffs (ưu tiên nếu là company_admin, staff)
        const staffSnap = await getDocs(query(
          collection(db, 'staffs'),
          where('userId', '==', uid)
        ));

        if (!staffSnap.empty) {
          const staffData = staffSnap.docs[0].data();
          setCompanyId(staffData.companyId || null);
        } else {
          // 2️⃣ Nếu không phải staff, fallback sang users
          const userDoc = await getDoc(doc(db, 'users', uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          setCompanyId(userData?.companyId || null);
        }
      } else {
        setCompanyId(null);
      }

      setLoading(false);
    });

    return () => unsubscribe(); // cleanup listener
  }, []);

  return { companyId, loading };
}
