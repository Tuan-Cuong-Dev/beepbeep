// app/dashboard/programs/page.tsx
export const revalidate = 0;

// ❗ Nếu dự án của bạn KHÔNG dùng `output: 'export'`, bạn có thể bật dòng sau.
// export const dynamic = 'force-dynamic'; // <- BỎ dòng này nếu dùng static export

import ProgramsPageClient from './ProgramsPageClient';

export default function Page() {
  return <ProgramsPageClient />;
}
