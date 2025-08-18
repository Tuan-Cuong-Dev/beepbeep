'use client';

import { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import DynamicRentalForm from './DynamicRentalForm';
import { useUser } from '@/src/context/AuthContext';

type EntityType = 'rentalCompany' | 'privateProvider';

interface Props {
  role: string;
  /** Với rentalCompany = companyId; Với privateProvider = providerId */
  companyId?: string;
  /** Tuỳ chọn: override logic suy ra từ role */
  entityType?: EntityType;
}

const RentBikeFormFactory: FC<Props> = ({ role, companyId: propCompanyId, entityType: propEntityType }) => {
  const { t } = useTranslation('common');
  const { user, companyId: contextCompanyId } = useUser();

  const ownerId = propCompanyId || contextCompanyId || '';
  const normalizedRole = (role || '').toLowerCase();

  const staffRoles = useMemo(
    () => ['company_admin', 'station_manager', 'technician', 'support'],
    []
  );

  // Suy ra entityType nếu không truyền prop
  const inferredEntityType: EntityType =
    normalizedRole === 'private_provider' 
      ? 'privateProvider'
      : 'rentalCompany';

  const entityType: EntityType = propEntityType ?? inferredEntityType;

  const isSupported =
    staffRoles.includes(normalizedRole) ||
    normalizedRole === 'company_owner' ||
    normalizedRole === 'private_provider';

  if (!user || !ownerId) {
    return (
      <div className="text-center py-10 text-red-500">
        {t('rent_bike_form_factory.missing')}
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="text-center py-10 text-gray-600">
        {t('rent_bike_form_factory.unsupported', { role })}
      </div>
    );
  }

  return (
    <DynamicRentalForm
      companyId={ownerId}
      userId={user.uid}
      entityType={entityType} // <-- truyền xuống form
    />
  );
};

export default RentBikeFormFactory;
