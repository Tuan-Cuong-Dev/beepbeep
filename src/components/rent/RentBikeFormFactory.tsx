// RentBikeFormFactory.tsx
'use client';
// Form thuê xe mặc định 
import { FC } from 'react';
import DynamicRentalForm from './DynamicRentalForm';
import { useUser } from '@/src/context/AuthContext';

interface Props {
  role: string;
}

const RentBikeFormFactory: FC<Props> = ({ role }) => {
  const { user, companyId } = useUser();

  if (!user || !companyId) return <div>Missing user or companyId</div>;

  switch (role.toLowerCase()) {
    case 'staff':
      return <DynamicRentalForm companyId={companyId} userId={user.uid} />;
    default:
      return <div>Unsupported role: {role}</div>;
  }
};

export default RentBikeFormFactory;
