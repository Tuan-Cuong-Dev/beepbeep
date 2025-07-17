'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useTranslation } from 'react-i18next';

export default function PolicyPage() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Header />

      <main className="flex-grow max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center">
          {t('policy_page.title')}
        </h1>
        <p className="mb-4 text-lg">{t('policy_page.intro')}</p>
        <ul className="list-disc list-inside space-y-3 text-base leading-relaxed">
          <li>{t('policy_page.point1')}</li>
          <li>{t('policy_page.point2')}</li>
          <li>
            {t('policy_page.point3.part1')}{' '}
            <span className="text-[#00d289] font-medium">buildinglocalbrand@gmail.com</span>
            {t('policy_page.point3.part2')}
          </li>
        </ul>
        <p className="mt-6 text-base">{t('policy_page.footer_note')}</p>
      </main>

      <Footer />
    </div>
  );
}
