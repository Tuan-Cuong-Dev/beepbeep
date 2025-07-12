// app/insuranceProducts/page.tsx
import { Suspense } from 'react';
import AdminInsuranceProductsPage from '@/src/components/admin/insurance/AdminInsuranceProductsPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminInsuranceProductsPage />
    </Suspense>
  );
}
