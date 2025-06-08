// 📄 src/app/vehicle-issues/report/page.tsx
import { Suspense } from 'react';
import ReportIssueClient from './ReportIssueClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReportIssueClient />
    </Suspense>
  );
}
