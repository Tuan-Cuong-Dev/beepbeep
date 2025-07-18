'use client';

import { Suspense } from 'react';
import Header from '@/src/components/landingpage/Header';
import ProfilesPageContent from '@/src/components/profile/ProfilesPageContent';

export const dynamic = 'force-dynamic';

export default function ProfilesPage() {
  return (
    <>
      {/* Global Header */}
      <Header />

      {/* Main Profile Content */}
      <Suspense fallback={<div className="p-4">Loading...</div>}>
        <ProfilesPageContent />
      </Suspense>
    </>
  );
}
