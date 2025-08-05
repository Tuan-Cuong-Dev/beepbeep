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
import { Button } from '@/src/components/ui/button';

const ITEMS_PER_PAGE = 10;

export default function AccessoryExportPage() {
  const { companyId, role } = useUser();
  const { t } = useTranslation('common');
  const [exports, setExports] = useState<AccessoryExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

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

  const totalPages = Math.ceil(exports.length / ITEMS_PER_PAGE);
  const paginatedExports = exports.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrevPage = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNextPage = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <UserTopMenu />

      <main className="flex-1 px-4 py-6 bg-gray-50 space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {t('accessory_export_page.title')}
        </h1>

        {!loading && (
          <>
            <AccessoryExportTable exports={paginatedExports} />

            {/* Pagination */}
            <div className="flex justify-center items-center gap-4 mt-4">
              <Button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="min-w-[80px]"
                variant="secondary"
              >
                {t('pagination.previous')}
              </Button>

              <span className="text-sm text-gray-700">
                {t('pagination.page_info', { current: currentPage, total: totalPages })}
              </span>

              <Button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="min-w-[80px]"
                variant="secondary"
              >
                {t('pagination.next')}
              </Button>
            </div>
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
