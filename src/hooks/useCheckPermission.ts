// Kiểm tra quyền User trước mọi hành động có yêu cầu thao tác với data firebases
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/src/firebaseConfig';

export function useCheckPermission(allowedRoles: string[] = []) {
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      if (!auth.currentUser) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const userData = userSnap.data();
        const role = userData?.role ?? null;
        setUserRole(role);

        if (allowedRoles.length === 0) {
          // Nếu không truyền allowedRoles → mặc định chỉ kiểm tra đăng nhập
          setHasPermission(!!role);
        } else {
          setHasPermission(allowedRoles.includes(role));
        }
      } catch (err) {
        console.error('❌ Failed to check permission:', err);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [allowedRoles]);

  return { hasPermission, loading, userRole };
}
