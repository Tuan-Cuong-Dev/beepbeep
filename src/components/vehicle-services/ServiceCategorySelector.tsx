'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaTools,
  FaCarAlt,
  FaBatteryFull,
  FaTruck,
  FaSoap,
  FaFileAlt,
} from 'react-icons/fa';

interface CategoryOption {
  key: string;
  icon: React.ReactNode;
}

interface Props {
  onSelect: (categoryKey: string) => void;
  selectedCategory?: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  {
    key: 'repair',
    icon: <FaTools className="text-xl text-[#00d289]" />,
  },
  {
    key: 'rental',
    icon: <FaCarAlt className="text-xl text-[#00d289]" />,
  },
  {
    key: 'battery',
    icon: <FaBatteryFull className="text-xl text-[#00d289]" />,
  },
  {
    key: 'transport',
    icon: <FaTruck className="text-xl text-[#00d289]" />,
  },
  {
    key: 'care',
    icon: <FaSoap className="text-xl text-[#00d289]" />,
  },
  {
    key: 'legal',
    icon: <FaFileAlt className="text-xl text-[#00d289]" />,
  },
];

export default function ServiceCategorySelector({
  onSelect,
  selectedCategory,
}: Props) {
  const { t } = useTranslation('common');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {CATEGORY_OPTIONS.map((cat) => (
        <button
          key={cat.key}
          onClick={() => onSelect(cat.key)}
          className={`flex items-start gap-4 p-4 rounded-xl border shadow-sm hover:shadow-md transition text-left ${
            selectedCategory === cat.key
              ? 'border-[#00d289] bg-[#f0fdfa]'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div>{cat.icon}</div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {t(`service_category_selector.${cat.key}.label`)}
            </h3>
            <p className="text-sm text-gray-500">
              {t(`service_category_selector.${cat.key}.description`)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
