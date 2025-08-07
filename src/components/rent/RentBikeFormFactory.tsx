'use client';

import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import DynamicRentalForm from './DynamicRentalForm';
import { useUser } from '@/src/context/AuthContext';

interface Props {
  role: string;
  companyId?: string;
}

const RentBikeFormFactory: FC<Props> = ({ role, companyId: propCompanyId }) => {
  const { t } = useTranslation('common');
  const { user, companyId: contextCompanyId } = useUser();

  const companyId = propCompanyId || contextCompanyId;

  if (!user || !companyId)
    return <div className="text-center py-10 text-red-500">{t('rent_bike_form_factory.missing')}</div>;

  const staffRoles = ['company_admin', 'station_manager', 'technician', 'support'];

  if (
    staffRoles.includes(role.toLowerCase()) ||
    role === 'company_owner' ||
    role === 'private_provider'
  ) {
    return <DynamicRentalForm companyId={companyId} userId={user.uid} />;
  }

  return (
    <div className="text-center py-10 text-gray-600">
      {t('rent_bike_form_factory.unsupported', { role })}
    </div>
  );
};

export default RentBikeFormFactory;
