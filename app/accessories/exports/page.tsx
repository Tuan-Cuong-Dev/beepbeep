'use client';

import { useEffect, useState } from 'react';
import { getAccessoryExports } from '@/src/lib/accessories/accessoryExportService';
import { AccessoryExport } from '@/src/lib/accessories/accessoryExportTypes';
import AccessoryExportTable from '@/src/components/accessories/AccessoryExportTable';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AccessoryExportPage() {
  const { companyId, role } = useUser();
  const { t } = useTranslation();
  const [exports, setExports] = useState<AccessoryExport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data =
        role === 'Admin'
          ? await getAccessoryExports()
          : companyId
          ? await getAccessoryExports(companyId)
          : [];

      setExports(data);
    } catch (error) {
      console.error('Failed to fetch exports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [companyId, role]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-4 py-6 bg-gray-50 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t('accessory_export_page.title')}
        </h1>

        {loading ? (
          <p className="text-gray-500">{t('accessory_export_page.loading')}</p>
        ) : (
          <AccessoryExportTable exports={exports} />
        )}
      </main>

      <Footer />
    </div>
  );
}
