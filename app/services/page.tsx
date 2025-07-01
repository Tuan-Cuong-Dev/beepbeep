// 📄 src/app/services/page.tsx
import { Suspense } from 'react';
import ServicesPage from './ServicesPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ServicesPage />
    </Suspense>
  );
}
