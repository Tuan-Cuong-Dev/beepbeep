'use client';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useTranslation } from 'react-i18next';

export default function ContactPage() {
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-800">
      <Header />

      <main className="flex-grow max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6 text-center">{t('contact_page.title')}</h1>
        <div className="space-y-3 leading-relaxed text-lg">
          <p>{t('contact_page.description')}</p>
          <p>📧 <strong>{t('contact_page.email_label')}:</strong> buildinglocalbrand@gmail.com</p>
          <p>📞 <strong>{t('contact_page.phone_label')}:</strong> +84 0972 155 557</p>
          <p>🏢 <strong>{t('contact_page.address_label')}:</strong> 166 Nguyễn Hoàng, Thanh Khê, Da Nang, Vietnam</p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
