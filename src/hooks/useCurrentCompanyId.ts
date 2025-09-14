// Hiện tại bạn đang lấy companyId trực tiếp dữ liệu thực tế của bạn có thể nằm ở 
// staffs hoặc users.business.id
// Chuẩn từ : 14/09/2025 

'use client';

import { useEffect, useState } from 'react';
import { auth, db } from '@/src/firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

type UseCurrentCompanyIdResult = {
  companyId: string | null;
  loading: boolean;
  error?: string | null;
  source?: 'owner' | 'staff' | 'users.business' | 'legacy' | 'none';
};

export function useCurrentCompanyId(): UseCurrentCompanyIdResult {
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<UseCurrentCompanyIdResult['source']>('none');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    setSource('none');

    const un = onAuthStateChanged(auth, async (user) => {
      if (!mounted) return;

      if (!user) {
        setCompanyId(null);
        setSource('none');
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
          if (!mounted) return;
          setCompanyId(ownerSnap.docs[0].id);
          setSource('owner');
          setLoading(false);
          return;
        }

        // 2) Staff: staffs where userId==uid AND accepted==true
        const staffQ = query(
          collection(db, 'staffs'),
          where('userId', '==', uid),
          where('accepted', '==', true),
          limit(1)
        );
        const staffSnap = await getDocs(staffQ);
        if (!staffSnap.empty) {
          const s = staffSnap.docs[0].data() as { companyId?: unknown };
          const staffCompanyId =
            typeof s?.companyId === 'string' && s.companyId.trim().length > 0
              ? s.companyId.trim()
              : null;

          if (!mounted) return;
          if (staffCompanyId) {
            setCompanyId(staffCompanyId);
            setSource('staff');
            setLoading(false);
            return;
          }
          // nếu staff doc có nhưng thiếu companyId, tiếp tục fallback users/*
        }

        // 3) users/{uid}: business.id (mới) hoặc companyId (legacy)
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const d = userDoc.data() as {
            business?: { id?: unknown };
            companyId?: unknown;
          };

          const businessId =
            typeof d?.business?.id === 'string' && d.business.id.trim().length > 0
              ? d.business.id.trim()
              : null;

          const legacyId =
            typeof d?.companyId === 'string' && d.companyId.trim().length > 0
              ? d.companyId.trim()
              : null;

          if (!mounted) return;
          if (businessId) {
            setCompanyId(businessId);
            setSource('users.business');
            setLoading(false);
            return;
          }
          if (legacyId) {
            setCompanyId(legacyId);
            setSource('legacy');
            setLoading(false);
            return;
          }
        }

        // 4) Không tìm thấy
        if (!mounted) return;
        setCompanyId(null);
        setSource('none');
        setLoading(false);
      } catch (e: any) {
        if (!mounted) return;
        setCompanyId(null);
        setSource('none');
        setError(e?.message ?? 'unknown');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      un();
    };
  }, []);

  return { companyId, loading, error, source };
}
