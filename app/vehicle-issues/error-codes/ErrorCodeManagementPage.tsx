'use client';

import { useState } from 'react';
import { useErrorCodes } from '@/src/hooks/useErrorCodes';
import ErrorCodeForm from '@/src/components/errorCodes/ErrorCodeForm';
import ErrorCodeTable from '@/src/components/errorCodes/ErrorCodeTable';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';
import { useTranslation } from 'react-i18next';

export default function ErrorCodeManagementPage() {
  const { t } = useTranslation('common');
  const { errorCodes, loading, deleteErrorCode, refetch } = useErrorCodes();
  const [selected, setSelected] = useState<ErrorCode | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 p-6 space-y-6 max-w-6xl mx-auto">
        {/* Title + subtitle */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            📋 {t('error_code_management_page.title')}
          </h1>
          <p className="text-sm text-gray-600">{t('error_code_management_page.subtitle')}</p>
        </div>

        {/* Existing list */}
        <section className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow border border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-700">
            📁 {t('error_code_management_page.existing')}
          </h2>

          {loading ? (
            <p className="text-gray-500">{t('error_code_management_page.loading')}</p>
          ) : (
            <ErrorCodeTable
              errorCodes={errorCodes}
              onEdit={(item) => setSelected(item)}
              onDelete={(item) => {
                if (confirm(t('error_code_management_page.confirm_delete', { code: item.code }))) {
                  deleteErrorCode(item.id);
                }
              }}
            />
          )}
        </section>

        {/* Add / Edit form */}
        <section className="bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow border border-gray-200">
          <ErrorCodeForm
            key={selected?.id || 'new'}
            existing={selected}
            onSaved={async () => { 
              setSelected(null);
              await refetch();
            }}
          />
        </section>
      </main>

      <Footer />
    </div>
  );
}
