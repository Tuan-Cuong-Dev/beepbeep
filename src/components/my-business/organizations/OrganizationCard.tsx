'use client';

import Link from 'next/link';
import { OrgCardData } from '@/src/lib/organizations/getUserOrganizations';
import { ORGANIZATION_LABELS } from '@/src/lib/organizations/organizationLabels';
import { useTranslation } from 'react-i18next';

export default function OrganizationCard({ org }: { org: OrgCardData }) {
  const href = `/dashboard`;
  const { t } = useTranslation('common');

  return (
    <div className="p-4 rounded-xl border shadow-sm bg-white flex gap-4 items-start">
      <div className="w-12 h-12 rounded-md overflow-hidden border bg-gray-50 flex items-center justify-center text-xl">
        {org.logoUrl ? (
          <img src={org.logoUrl} alt={org.name} className="object-cover w-full h-full" />
        ) : (
          '🏢'
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-800">{org.name}</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {t(`organization_card.type.${org.type}`, { defaultValue: org.type })}
          {org.subtype ? ` · ${org.subtype}` : ''}
        </p>
        {org.displayAddress && (
          <p className="text-xs text-gray-500 mt-1">{org.displayAddress}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {t('organization_card.your_role')}: {t(`organization_card.role.${org.userRoleInOrg}`, { defaultValue: org.userRoleInOrg })}
        </p>
        <Link
          href={href}
          className="inline-block mt-2 text-sm px-3 py-1 rounded-md border border-[#00d289] text-[#00d289] hover:bg-[#00d289] hover:text-white transition"
        >
          {t('organization_card.manage')}
        </Link>
      </div>
    </div>
  );
}
