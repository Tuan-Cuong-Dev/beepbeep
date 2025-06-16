// 📄 src/app/vehicle-issues/proposals/page.tsx
'use client';

import { Suspense } from 'react';
import VehicleIssueProposalsPage from './VehicleIssueProposalsPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VehicleIssueProposalsPage />
    </Suspense>
  );
}
