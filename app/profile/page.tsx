'use client';

import { Suspense } from 'react';
import ProfilesPageContent from '@/src/components/profile/ProfilesPageContent'; // hoặc nội tuyến ở dưới

export const dynamic = 'force-dynamic';

export default function ProfilesPage() {
  return (
    <Suspense fallback={<div className="p-4">Loading...</div>}>
      <ProfilesPageContent />
    </Suspense>
  );
}
