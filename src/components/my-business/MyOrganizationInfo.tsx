'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { getUserOrganizations, OrgCardData } from '@/src/lib/organizations/getUserOrganizations';
import OrganizationCreateChooser from './OrganizationCreateChooser';
import OrganizationCard from './OrganizationCard';
import { useTranslation } from 'react-i18next';

export default function MyOrganizationInfo() {
  const { t } = useTranslation('common'); // ⬅️ Không truyền namespace
  const { currentUser } = useAuth();
  const [organizations, setOrganizations] = useState<OrgCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;
    fetchOrganizations(currentUser.uid);
  }, [currentUser]);

  const fetchOrganizations = async (uid: string) => {
    try {
      const data = await getUserOrganizations(uid);
      setOrganizations(data);
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        {t('my_organization_info.loading')}
      </p>
    );
  }

  if (organizations.length === 0) {
    return <OrganizationCreateChooser />;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {organizations.map((org) => (
        <OrganizationCard key={`${org.type}-${org.id}`} org={org} />
      ))}
    </div>
  );
}
