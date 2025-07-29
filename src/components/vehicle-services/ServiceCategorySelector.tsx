'use client';

import React from 'react';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaTools,
  FaCarAlt,
  FaBatteryFull,
  FaTruck,
  FaSoap,
  FaFileAlt,
} from 'react-icons/fa';
import type { ServiceCategoryKey } from '@/src/lib/vehicle-services/serviceTypes';

interface Props {
  onSelect: (categoryKey: ServiceCategoryKey) => void;
  selectedCategory?: ServiceCategoryKey;
  allowedCategories?: ServiceCategoryKey[];
}

// 🎨 Style icon chuẩn thương hiệu
const iconClass = 'text-xl';
const iconStyle = { color: '#00d289' };

// 🧩 Icon theo từng category
const CATEGORY_ICONS: Record<ServiceCategoryKey, ReactElement> = {
  repair: <FaTools className={iconClass} style={iconStyle} />,
  rental: <FaCarAlt className={iconClass} style={iconStyle} />,
  battery: <FaBatteryFull className={iconClass} style={iconStyle} />,
  transport: <FaTruck className={iconClass} style={iconStyle} />,
  care: <FaSoap className={iconClass} style={iconStyle} />,
  legal: <FaFileAlt className={iconClass} style={iconStyle} />,
};

export default function ServiceCategorySelector({
  onSelect,
  selectedCategory,
  allowedCategories,
}: Props) {
  const { t } = useTranslation('common');

  const visibleKeys: ServiceCategoryKey[] = allowedCategories?.length
    ? allowedCategories
    : (Object.keys(CATEGORY_ICONS) as ServiceCategoryKey[]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {visibleKeys.map((key) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`flex items-start gap-4 p-4 rounded-xl border shadow-sm hover:shadow-md transition text-left ${
            selectedCategory === key
              ? 'border-[#00d289] bg-[#f0fdfa]'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div>{CATEGORY_ICONS[key]}</div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {t(`service_category_selector.${key}.label`, { defaultValue: key })}
            </h3>
            <p className="text-sm text-gray-500">
              {t(`service_category_selector.${key}.description`, { defaultValue: '' })}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
