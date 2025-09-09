// app/dashboard/programs/page.tsx  (KHÔNG 'use client')
export const revalidate = 0;
export const dynamic = 'force-dynamic';     // OK nếu không export static

import NextDynamic from 'next/dynamic';     // ⬅ alias, tránh trùng tên

const ProgramsPageClient = NextDynamic(
  () => import('./ProgramsPageClient'),     // file client
  { ssr: false }                            // tắt SSR cho component này
);

export default function Page() {
  return <ProgramsPageClient />;
}
