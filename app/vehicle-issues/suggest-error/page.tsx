'use client';

import TechnicianSuggestErrorCode from '@/src/components/errorCodes/TechnicianSuggestErrorCode';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import UserTopMenu from '@/src/components/landingpage/UserTopMenu';
import { useTranslation } from 'react-i18next';

export default function SuggestErrorPage() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <UserTopMenu />
      <main className="flex-1 p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            🛠 {t('technician_suggest_error_code.title')}
          </h1>
          <p className="text-sm text-gray-600">
            {t('technician_suggest_error_code.subtitle')}
          </p>
        </div>

        <TechnicianSuggestErrorCode />
      </main>
      <Footer />
    </div>
  );
}
