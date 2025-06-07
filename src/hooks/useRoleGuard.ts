// src/hooks/useRoleGuard.ts

import { useAuthContext } from '@/src/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRoleGuard(allowedRoles: string[]) {
  const { role, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role && !allowedRoles.includes(role)) {
      router.push('/unauthorized'); // hoặc trang home
    }
  }, [role, loading, allowedRoles, router]);
}
