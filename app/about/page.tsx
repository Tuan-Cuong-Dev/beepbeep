'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Header />

      <main className="flex-grow max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center">{t('about_page.title')}</h1>

        <div className="space-y-5 leading-relaxed text-justify text-base">
          <p>{t('about_page.p1')}</p>
          <p>{t('about_page.p2')}</p>
          <p>{t('about_page.p3')}</p>
          <p>{t('about_page.p4')}</p>

          <ul className="list-disc list-inside mt-3 space-y-1">
            <li>{t('about_page.roles.customers')}</li>
            <li>{t('about_page.roles.staff')}</li>
            <li>{t('about_page.roles.station_managers')}</li>
            <li>{t('about_page.roles.company_owners')}</li>
            <li>{t('about_page.roles.technicians')}</li>
            <li>{t('about_page.roles.private_owners')}</li>
            <li>{t('about_page.roles.investors')}</li>
            <li>{t('about_page.roles.agents')}</li>
          </ul>

          <p>{t('about_page.p5')}</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
