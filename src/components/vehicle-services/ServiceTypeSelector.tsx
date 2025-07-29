'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { SERVICE_TYPE_ICONS, SERVICE_TYPES_BY_CATEGORY } from '@/src/lib/vehicle-services/serviceTypes';
import type { SupportedServiceType, ServiceCategoryKey } from '@/src/lib/vehicle-services/serviceTypes';

interface Props {
  selectedCategory: ServiceCategoryKey;
  onSelect: (serviceType: SupportedServiceType) => void;
  selectedService?: SupportedServiceType;
}

const iconClass = 'text-xl text-[#00d289]';

export default function ServiceTypeSelector({
  selectedCategory,
  onSelect,
  selectedService,
}: Props) {
  const { t } = useTranslation('common');
  const serviceKeys = SERVICE_TYPES_BY_CATEGORY[selectedCategory] || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {serviceKeys.map((key) => {
        const labelKey = `service_type_selector.${selectedCategory}.${key}.label`;
        const descKey = `service_type_selector.${selectedCategory}.${key}.description`;
        const icon = SERVICE_TYPE_ICONS[key];

        return (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`flex items-start gap-4 p-4 rounded-xl border shadow-sm hover:shadow-md transition text-left ${
              selectedService === key
                ? 'border-[#00d289] bg-[#f0fdfa]'
                : 'border-gray-200 bg-white'
            }`}
          >
            <div>{icon}</div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                {t(labelKey, { defaultValue: `[Missing ${labelKey}]` })}
              </h3>
              <p className="text-sm text-gray-500">
                {t(descKey, { defaultValue: `[Missing ${descKey}]` })}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
