'use client';

import { useRouter } from 'next/navigation';
import { useUser } from '@/src/context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  FaCalendarAlt,
  FaStore,
  FaMotorcycle,
  FaUser,
  FaUserCog,
  FaBatteryFull,
  FaToolbox,
} from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract } from '@fortawesome/free-solid-svg-icons';
import { IconType } from 'react-icons';

type MenuItem = {
  key: string; // i18n key
  path: string;
  icon: IconType | typeof faFileContract;
  roles: string[];
};

const menuItems: MenuItem[] = [
  {
    key: 'bookings',
    path: '/bookings',
    icon: FaCalendarAlt,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'staff'],
  },
  {
    key: 'rental_companies',
    path: '/rental-companies',
    icon: FaStore,
    roles: ['admin'],
  },
  {
    key: 'vehicle_management',
    path: '/vehicles',
    icon: FaMotorcycle,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'staff'],
  },
  {
    key: 'users_management',
    path: '/users',
    icon: FaUser,
    roles: ['admin'],
  },
  {
    key: 'customers_management',
    path: '/customers',
    icon: FaUserCog,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'staff'],
  },
  {
    key: 'staff_management',
    path: '/dashboard/staff',
    icon: FaUserCog,
    roles: ['admin', 'company_owner', 'company_admin'],
  },
  {
    key: 'battery_management',
    path: '/battery',
    icon: FaBatteryFull,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'technician'],
  },
  {
    key: 'accessories_management',
    path: '/accessories',
    icon: FaToolbox,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'technician'],
  },
  {
    key: 'accessory_exports',
    path: '/accessories/exports',
    icon: FaToolbox,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'technician'],
  },
  {
    key: 'subscription_packages',
    path: '/subscriptionPackages',
    icon: faFileContract,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin'],
  },
];

export default function UserTopMenu() {
  const router = useRouter();
  const { role } = useUser();
  const { t } = useTranslation('common');

  if (!role) return null;
  const normalizedRole = role.toLowerCase();

  const filteredMenu = menuItems.filter((item) => item.roles.includes(normalizedRole));
  if (!filteredMenu.length) return null;

  return (
    <nav className="hidden md:block font-inter bg-[#00d289] text-white w-full shadow overflow-x-auto no-scrollbar ">
      <div className="flex gap-x-6 justify-center items-center px-4 py-2 min-w-max">
        {filteredMenu.map((item) => (
          <button
            key={item.key}
            onClick={() => router.push(item.path)}
            className="flex items-center gap-2 font-medium text-sm hover:underline transition whitespace-nowrap flex-shrink-0"
          >
            {renderIcon(item.icon)}
            <span>{t(`user_top_menu.${item.key}`)}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

function renderIcon(icon: IconType | typeof faFileContract) {
  if (typeof icon === 'function') {
    const IconComponent = icon;
    return <IconComponent className="w-4 h-4" />;
  }
  return <FontAwesomeIcon icon={icon} className="w-4 h-4" />;
}
