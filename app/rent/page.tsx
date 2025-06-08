import { Suspense } from 'react';
import RentPageClient from './RentPageClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RentPageClient />
    </Suspense>
  );
}
