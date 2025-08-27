// app/admin/techincian-live-map/page.tsx
'use client';

import { useMemo } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import TechnicianLiveMap from '@/src/components/admin/TechnicianLiveMap';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AdminTechnicianLiveMapPage() {
  const { t } = useTranslation('common');
  const { role } = useUser();

  const normalizedRole = (role || '').toLowerCase();
  const canView = useMemo(
    () => normalizedRole === 'admin',
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
