'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import ReportIssueForm from '@/src/components/vehicle-issues/ReportIssueForm';
import { useCompanyAndStation } from '@/src/hooks/useCompanyAndStation';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useUser } from '@/src/context/AuthContext';

export default function ReportIssueClient() {
  const { t } = useTranslation('common');
  const { role } = useUser();
  const { companyId, companyName, stationId, stationName, loading } = useCompanyAndStation();
  const [notification, setNotification] = useState<string | null>(null);

  const isGlobalRole = role === 'admin' || role === 'technician_assistant';

  if (loading) {
    return (
      <div className="text-center py-10">
        {t('report_issue_client.loading')}
      </div>
    );
  }

  if (!companyId && !isGlobalRole) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 px-4 max-w-3xl mx-auto flex flex-col justify-center items-center text-gray-500 space-y-4">
          <h1 className="text-2xl font-semibold">🚫 {t('report_issue_client.title')}</h1>
          <p>{t('report_issue_client.missing_company')}</p>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 p-3 sm:p-6 space-y-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-800">
          🚨 {t('report_issue_client.heading')}
        </h1>

        <div className="text-sm text-gray-500 text-center space-y-1">
          <div><strong>{t('report_issue_client.company')}:</strong> {companyName || '—'}</div>
          {stationId && <div><strong>{t('report_issue_client.station')}:</strong> {stationName}</div>}
        </div>

        <div className="bg-white rounded-2xl border p-4 sm:p-6 md:p-10 space-y-8 shadow w-full max-w-4xl mx-auto">
          <ReportIssueForm
            companyId={companyId || ''}
            companyName={companyName || ''}
            stationId={stationId || ''}
            stationName={stationName || ''}
            onReported={() => setNotification(t('report_issue_client.success'))}
          />
        </div>
      </main>

      <Footer />

      <NotificationDialog
        open={!!notification}
        type="success"
        title={t('report_issue_client.success_title')}
        description={notification || undefined}
        onClose={() => setNotification(null)}
      />
    </div>
  );
}
