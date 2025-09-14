'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/src/firebaseConfig';
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

type UseCurrentCompanyIdResult = {
  companyId: string | null;
  loading: boolean;
  error?: string | null;
};

export function useCurrentCompanyId(): UseCurrentCompanyIdResult {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true; // tránh setState sau khi unmount
    setLoading(true);
    setError(null);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      if (!user) {
        // chưa đăng nhập
        setCompanyId(null);
        setLoading(false);
        return;
      }

      const uid = user.uid;

      try {
        // 1) Company Owner: rentalCompanies.ownerId === uid
        const ownerQ = query(
          collection(db, 'rentalCompanies'),
          where('ownerId', '==', uid),
          limit(1)
        );
        const ownerSnap = await getDocs(ownerQ);
        if (!ownerSnap.empty) {
          if (!isMounted) return;
          setCompanyId(ownerSnap.docs[0].id);
          setLoading(false);
          return;
        }

        // 2) Staff đã được accept: staffs where userId==uid and accepted==true
        const staffQ = query(
          collection(db, 'staffs'),
          where('userId', '==', uid),
          where('accepted', '==', true),
          limit(1)
        );
        const staffSnap = await getDocs(staffQ);
        if (!staffSnap.empty) {
          const data = staffSnap.docs[0].data() as { companyId?: string | null };
          if (!isMounted) return;
          setCompanyId(data?.companyId ?? null);
          setLoading(false);
          return;
        }

        // 3) Fallback: users/{uid}.companyId (nếu còn dùng field này)
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data() as { companyId?: string | null };
          if (!isMounted) return;
          setCompanyId(data?.companyId ?? null);
          setLoading(false);
          return;
        }

        // Không tìm thấy công ty liên kết
        if (!isMounted) return;
        setCompanyId(null);
        setLoading(false);
      } catch (e: any) {
        if (!isMounted) return;
        setCompanyId(null);
        setError(e?.message ?? 'unknown');
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  return { companyId, loading, error };
}
