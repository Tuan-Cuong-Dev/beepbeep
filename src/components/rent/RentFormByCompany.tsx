'use client';

// Form thuê xe theo công ty
import { useUser } from '@/src/context/AuthContext';
import DynamicRentalForm from '@/src/components/rent/DynamicRentalForm';
import { useTranslation } from 'react-i18next';

export default function RentFormByCompany() {
  const { t } = useTranslation('common');
  const { user, companyId, role, loading } = useUser();

  if (loading) return <div className="text-center py-10 text-gray-500">{t('rent_form_by_company.loading')}</div>;
  if (!user || !companyId) return <div className="text-center py-10 text-red-500">{t('rent_form_by_company.access_denied')}</div>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">🛵 {t('rent_form_by_company.title')}</h1>
      <DynamicRentalForm companyId={companyId} userId={user.uid} />
    </div>
  );
}
