// app/admin/techincian-live-map/page.tsx
'use client';

import { useMemo } from 'react';
import nextDynamic from 'next/dynamic'; // 👈 đổi tên import để không đụng 'dynamic' của Next
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';

// ✅ Tắt prerender tĩnh để tránh đụng window khi build
export const dynamic = 'force-dynamic'; // hoặc: export const revalidate = 0;

// ✅ Dynamic import component bản đồ (client-only)
const TechnicianLiveMap = nextDynamic(
  () => import('@/src/components/admin/TechnicianLiveMap'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[70vh] rounded border grid place-items-center text-sm text-gray-600">
        Đang tải bản đồ…
      </div>
    ),
  }
);

export default function AdminTechnicianLiveMapPage() {
  const { t } = useTranslation('common');
  const { role } = useUser();

  const normalizedRole = (role || '').toLowerCase();
  // Nếu muốn cho Assistant xem luôn, thêm điều kiện dưới
  const canView = useMemo(
    () => normalizedRole === 'admin', // || normalizedRole === 'technician_assistant'
    [normalizedRole]
  );

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            🗺️ {t('technician_live_map.map.title')}
          </h1>
        <p className="text-sm text-gray-600">{t('technician_live_map.map.hint')}</p>
        </div>

        {!canView ? (
          <div className="text-center py-10 text-red-600 font-medium">
            {t('no_permission') || 'Bạn không có quyền truy cập trang này.'}
          </div>
        ) : (
          <section className="bg-white rounded-2xl border border-gray-200 shadow">
            <TechnicianLiveMap />
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
