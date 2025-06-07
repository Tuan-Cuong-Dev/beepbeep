'use client';

import { useRouter } from 'next/navigation';
import {
  FaCalendarAlt,
  FaStore,
  FaMotorcycle,
  FaUser,
  FaUserCog,
  FaBatteryFull,
  FaToolbox, // ✅ Icon cho Accessories
} from 'react-icons/fa';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract } from '@fortawesome/free-solid-svg-icons';
import { useUser } from '@/src/context/AuthContext';
import { IconType } from 'react-icons';

type MenuItem = {
  label: string;
  path: string;
  icon: IconType | typeof faFileContract;
  roles: string[];
};

const menuItems: MenuItem[] = [
  {
    label: 'Bookings',
    path: '/bookings',
    icon: FaCalendarAlt,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'staff'],
  },
  {
    label: 'Rental Companies',
    path: '/rental-companies',
    icon: FaStore,
    roles: ['admin'],
  },
  {
    label: 'Vehicle Management',
    path: '/vehicles',
    icon: FaMotorcycle,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'staff'],
  },
  {
    label: 'Users Management',
    path: '/users',
    icon: FaUser,
    roles: ['admin'],
  },
  {
    label: 'Customers Management',
    path: '/customers',
    icon: FaUserCog,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'staff'],
  },
  {
    label: 'Battery Management',
    path: '/battery',
    icon: FaBatteryFull,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'technician'],
  },
  {
    label: 'Accessories Management',
    path: '/accessories',
    icon: FaToolbox,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'technician'],
  },
  {
    label: 'Accessory Exports',
    path: '/accessories/exports',
    icon: FaToolbox,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin', 'station_manager', 'technician'],
  },
  {
    label: 'Subscription Packages',
    path: '/subscriptionPackages',
    icon: faFileContract,
    roles: ['admin', 'company_owner', 'private_owner', 'company_admin'],
  },
];

export default function UserTopMenu() {
  const router = useRouter();
  const { role } = useUser();

  if (!role) return null;

  const normalizedRole = role.toLowerCase();

  const filteredMenu = menuItems.filter((item) =>
    item.roles.includes(normalizedRole)
  );

  if (!filteredMenu.length) return null;

  return (
    <div className="hidden md:flex font-inter bg-[#00d289] text-white w-full px-1 py-2 justify-center gap-x-8 items-center">
      {filteredMenu.map((item) => (
        <button
          key={item.label}
          onClick={() => router.push(item.path)}
          className="flex items-center space-x-2 font-medium text-sm hover:underline"
        >
          {'icon' in item &&
            (typeof item.icon === 'function' ? (
              <item.icon />
            ) : (
              <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
            ))}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
