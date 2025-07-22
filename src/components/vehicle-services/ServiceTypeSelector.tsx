'use client';

import React from 'react';
import {
  FaWrench,
  FaBolt,
  FaMapMarkerAlt,
  FaCar,
  FaUserTie,
  FaTruck,
  FaBus,
  FaShieldAlt,
  FaFileSignature,
  FaBroom,
  FaShoppingBag,
  FaRoute,
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

interface ServiceTypeOption {
  key: string;
  icon: React.ReactNode;
}

interface Props {
  selectedCategory: string;
  onSelect: (serviceType: string) => void;
  selectedService?: string;
}

const SERVICE_TYPE_MAP: Record<string, ServiceTypeOption[]> = {
  repair: [
    { key: 'repair', icon: <FaWrench /> },
    { key: 'battery_check', icon: <FaBolt /> },
  ],
  rental: [
    { key: 'rental_self_drive', icon: <FaCar /> },
    { key: 'rental_with_driver', icon: <FaUserTie /> },
    { key: 'tour', icon: <FaMapMarkerAlt /> },
  ],
  battery: [
    { key: 'battery_swap', icon: <FaBolt /> },
    { key: 'battery_delivery', icon: <FaTruck /> },
  ],
  transport: [
    { key: 'vehicle_rescue', icon: <FaBus /> },
    { key: 'intercity_transport', icon: <FaRoute /> },
  ],
  care: [
    { key: 'vehicle_cleaning', icon: <FaBroom /> },
    { key: 'accessories_sales', icon: <FaShoppingBag /> },
  ],
  legal: [
    { key: 'insurance', icon: <FaShieldAlt /> },
    { key: 'registration_support', icon: <FaFileSignature /> },
  ],
};

export default function ServiceTypeSelector({
  selectedCategory,
  onSelect,
  selectedService,
}: Props) {
  const { t } = useTranslation('common');
  const options = SERVICE_TYPE_MAP[selectedCategory] || [];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {options.map((item) => (
        <button
          key={item.key}
          onClick={() => onSelect(item.key)}
          className={`flex items-start gap-4 p-4 rounded-xl border shadow-sm hover:shadow-md transition text-left ${
            selectedService === item.key
              ? 'border-[#00d289] bg-[#f0fdfa]'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="text-xl text-[#00d289]">{item.icon}</div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">
              {t(`service_type_selector.${selectedCategory}.${item.key}.label`)}
            </h3>
            <p className="text-sm text-gray-500">
              {t(`service_type_selector.${selectedCategory}.${item.key}.description`)}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
