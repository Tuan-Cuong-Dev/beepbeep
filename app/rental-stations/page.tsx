// 📄 src/app/services/page.tsx
import { Suspense } from 'react';
import StationPage from './StationPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StationPage/>
    </Suspense>
  );
}
