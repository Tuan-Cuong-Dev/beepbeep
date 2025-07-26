'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import MyServiceList from '@/src/components/my-business/MyServiceList';
import MyOrganizationInfo from '@/src/components/my-business/organizations/MyOrganizationInfo';
import { OrgCardData } from '@/src/lib/organizations/getUserOrganizations';

export default function MyBusinessSection() {
  const { t } = useTranslation('common');
  const [organizations, setOrganizations] = useState<OrgCardData[]>([]);

  // ✅ Tìm tổ chức mà user là chủ doanh nghiệp
  const ownerOrg = organizations.find((org) => org.userRoleInOrg === 'owner');

  return (
    <div className="space-y-10">
      {/* SECTION 1: Organization info */}
      <section>
        <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
          {t('my_business_section.organization_title')}
        </h2>
        <MyOrganizationInfo onLoaded={setOrganizations} />
      </section>

      {/* SECTION 2: Services (chỉ hiển thị nếu là chủ doanh nghiệp) */}
      {ownerOrg && (
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            {t('my_business_section.services_title')}
          </h2>
          <MyServiceList orgType={ownerOrg.type} />
        </section>
      )}
    </div>
  );
}
