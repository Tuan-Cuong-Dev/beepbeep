// app/insurance-approvals/page.tsx
import { Suspense } from 'react';
import InsuranceApprovalPage from '@/src/components/admin/insurance/InsuranceApprovalPage';
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InsuranceApprovalPage />
    </Suspense>
  );
}
