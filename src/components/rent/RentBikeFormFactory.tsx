'use client';

import { FC } from 'react';
import DynamicRentalForm from './DynamicRentalForm';
import { useUser } from '@/src/context/AuthContext';

interface Props {
  role: string;
  companyId?: string;
}

const RentBikeFormFactory: FC<Props> = ({ role, companyId: propCompanyId }) => {
  const { user, companyId: contextCompanyId } = useUser();

  const companyId = propCompanyId || contextCompanyId;

  if (!user || !companyId) return <div>Missing user or companyId</div>;

  const staffRoles = ['company_admin', 'station_manager', 'technician', 'support'];

  if (staffRoles.includes(role.toLowerCase()) || role === 'company_owner' || role === 'private_provider') {
    return <DynamicRentalForm companyId={companyId} userId={user.uid} />;
  }

  return <div>Unsupported role: {role}</div>;
};

export default RentBikeFormFactory;
