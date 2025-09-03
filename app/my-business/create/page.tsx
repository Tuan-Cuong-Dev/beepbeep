// app/my-business/create/page.tsx
// Bạn gặp lỗi vì useSearchParams() trong App Router bắt buộc phải nằm trong một <Suspense> boundary.

'use client';

import { Suspense } from 'react';
import CreateBusinessPage from '@/src/components/my-business/create/CreateBusinessPage';

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-600">Đang tải…</div>}>
      <CreateBusinessPage />
    </Suspense>
  );
}

