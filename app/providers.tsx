// app/providers.tsx
'use client';

import { PropsWithChildren, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider, useUser } from '@/src/context/AuthContext';
import MobileStickyTrackerBar from '@/src/components/techinicianPartner/MobileStickyTrackerBar';
import { isMobileTechnician } from '@/src/utils/isMobileTechnician';
import { useUserProfile } from '@/src/hooks/useUserProfile';

const HIDE_BAR_ROUTES = ['/auth', '/login', '/admin/signin'];

function Inner({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const { user: authUser } = useUser();
  const { user: profile, loading } = useUserProfile();

  const enrichedUser = useMemo(() => {
    if (!authUser) return null;
    return profile ? ({ ...authUser, ...profile } as any) : (authUser as any);
  }, [authUser, profile]);

  const showBar = useMemo(() => {
    if (HIDE_BAR_ROUTES.some(p => pathname?.startsWith(p))) return false;
    if (!enrichedUser) return false;
    if (loading) return false;
    return isMobileTechnician(enrichedUser);
  }, [pathname, enrichedUser, loading]);

  return (
    <>
      <div className="min-h-dvh">{children}</div>
      {showBar && <div className="h-20 sm:h-0" />}
      {showBar && (
        <MobileStickyTrackerBar
          key={enrichedUser?.uid || 'anon'}
          user={enrichedUser}                 // ✅ truyền user đã gộp
          className="sm:hidden"              // chỉ ẩn khi ≥640px (giữ nguyên chủ đích)
        />
      )}
    </>
  );
}

export default function Providers({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <Inner>{children}</Inner>
    </AuthProvider>
  );
}
