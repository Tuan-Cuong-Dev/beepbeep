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

const iconClass = 'text-xl text-[#00d289]';

const SERVICE_TYPE_MAP: Record<string, ServiceTypeOption[]> = {
  repair: [
    { key: 'repair', icon: <FaWrench className={iconClass} /> },
    { key: 'battery_check', icon: <FaBolt className={iconClass} /> },
  ],
  rental: [
    { key: 'rental_self_drive', icon: <FaCar className={iconClass} /> },
    { key: 'rental_with_driver', icon: <FaUserTie className={iconClass} /> },
    { key: 'tour', icon: <FaMapMarkerAlt className={iconClass} /> },
  ],
  battery: [
    { key: 'battery_swap', icon: <FaBolt className={iconClass} /> },
    { key: 'battery_delivery', icon: <FaTruck className={iconClass} /> },
  ],
  transport: [
    { key: 'vehicle_rescue', icon: <FaBus className={iconClass} /> },
    { key: 'intercity_transport', icon: <FaRoute className={iconClass} /> },
  ],
  care: [
    { key: 'vehicle_cleaning', icon: <FaBroom className={iconClass} /> },
    { key: 'accessories_sales', icon: <FaShoppingBag className={iconClass} /> },
  ],
  legal: [
    { key: 'insurance', icon: <FaShieldAlt className={iconClass} /> },
    { key: 'registration_support', icon: <FaFileSignature className={iconClass} /> },
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
      {options.map(({ key, icon }) => {
        const labelKey = `service_type_selector.${selectedCategory}.${key}.label`;
        const descKey = `service_type_selector.${selectedCategory}.${key}.description`;

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
