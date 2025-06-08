// 📄 src/app/return/page.tsx
import { Suspense } from 'react';
import ReturnPageClient from './ReturnPageClient';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ReturnPageClient />
    </Suspense>
  );
}
