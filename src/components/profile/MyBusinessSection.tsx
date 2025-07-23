'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import MyServiceList from '@/src/components/my-business/MyServiceList';
import MyOrganizationInfo from '@/src/components/my-business/MyOrganizationInfo';

export default function MyBusinessSection() {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-10">
      {/* SECTION 1: Services provided by the user */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
          {t('my_business_section.services_title')}
        </h2>
        <MyServiceList />
      </section>

      {/* SECTION 2: Organization or business entity the user is part of */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
          {t('my_business_section.organization_title')}
        </h2>
        <MyOrganizationInfo />
      </section>
    </div>
  );
}
