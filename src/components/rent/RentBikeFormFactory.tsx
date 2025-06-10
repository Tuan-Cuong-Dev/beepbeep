// RentBikeFormFactory.tsx
'use client';

import { FC } from 'react';
import DynamicRentalForm from './DynamicRentalForm';
import { useUser } from '@/src/context/AuthContext';

interface Props {
  role: string;
}

const RentBikeFormFactory: FC<Props> = ({ role }) => {
  const { user, companyId } = useUser();

  if (!user || !companyId) return <div>Missing user or companyId</div>;

  const staffRoles = ['company_admin', 'station_manager', 'technician', 'support'];

  if (staffRoles.includes(role.toLowerCase())) {
    return <DynamicRentalForm companyId={companyId} userId={user.uid} />;
  }

  return <div>Unsupported role: {role}</div>;
};

export default RentBikeFormFactory;
