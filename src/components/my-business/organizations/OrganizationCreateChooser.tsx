'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ORG_OPTIONS } from './organizationOptions';

export default function OrganizationCreateChooser() {
  const { t } = useTranslation('common');

  const getI18nKey = (option: {
    type: string;
    subtype?: string;
  }) =>
    `organization_create_chooser.${option.type}${
      option.subtype ? '.' + option.subtype : ''
    }`;

  return (
    <div className="border border-dashed border-gray-300 rounded-xl p-6 bg-gray-50">
      <h3 className="text-base font-semibold text-gray-700 mb-4">
        👋 {t('organization_create_chooser.intro')}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {ORG_OPTIONS.map((option) => (
          <Link
            key={option.key}
            href={option.path}
            className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:border-[#00d289] hover:shadow transition"
          >
            <div className="flex items-center gap-3">
              {option.icon()}
              <div>
                <h4 className="font-semibold text-sm text-gray-800">
                  {t(`${getI18nKey(option)}.title`)}
                </h4>
                <p className="text-xs text-gray-500">
                  {t(`${getI18nKey(option)}.description`)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
