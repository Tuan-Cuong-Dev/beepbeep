// app/my-business/create/page.tsx
'use client';

import { Suspense } from 'react';
import CreateBusinessPageClient from './CreateBusinessPageClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateBusinessPageClient />
    </Suspense>
  );
}
