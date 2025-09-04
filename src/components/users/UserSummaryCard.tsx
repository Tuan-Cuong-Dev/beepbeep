'use client';

import { useMemo } from 'react';
import type { User } from '@/src/lib/users/userTypes';
import { useTranslation } from 'react-i18next';

// If you already export BusinessType elsewhere, reuse that import instead
export type BusinessType =
  | 'rental_company'
  | 'private_provider'
  | 'agent'
  | 'technician_partner'
  | 'city_driver'
  | 'intercity_driver'
  | 'delivery_partner'
  | 'intercity_bus'
  | 'vehicle_transport'
  | 'tour_guide';

interface Props {
  users: User[];
}

export default function UserSummaryCard({ users }: Props) {
  const { t } = useTranslation('common');
  const td = (key: string, def?: string) => (def ? t(key, { defaultValue: def }) : t(key));

  // ===== Roles =====
  const roleOrder = [
    'admin',
    'company_owner',
    'station_manager',
    'staff',
    'agent',
    'technician',
    'technician_partner',
    'technician_assistant',
    'private_provider',
    'investor',
    'customer',
    'city_driver',
    'intercity_driver',
    'delivery_partner',
    'intercity_bus',
    'vehicle_transport',
    'tour_guide',
  ] as const;
  type RoleKey = typeof roleOrder[number];
  const roleSet = useMemo(() => new Set<RoleKey>(roleOrder as readonly RoleKey[]), []);

  const roleLabels: Record<string, string> = {
    admin: td('roles.admin', 'Admin'),
    company_owner: td('roles.company_owner', 'Company Owner'),
    station_manager: td('roles.station_manager', 'Station Manager'),
    staff: td('roles.staff', 'Staff'),
    agent: td('roles.agent', 'Agent'),
    technician: td('roles.technician', 'Technician'),
    technician_partner: td('roles.technician_partner', 'Technician Partner'),
    technician_assistant: td('roles.technician_assistant', 'Technician Assistant'),
    private_provider: td('roles.private_provider', 'Private Provider'),
    investor: td('roles.investor', 'Investor'),
    customer: td('roles.Customer', 'Customer'),
    city_driver: td('roles.city_driver', 'City Driver'),
    intercity_driver: td('roles.intercity_driver', 'Intercity Driver'),
    delivery_partner: td('roles.delivery_partner', 'Delivery Partner'),
    intercity_bus: td('roles.intercity_bus', 'Intercity Bus'),
    vehicle_transport: td('roles.vehicle_transport', 'Vehicle Transport'),
    tour_guide: td('roles.tour_guide', 'Tour Guide'),
    other: td('roles.other', 'Other'),
  };

  const roleColors: Record<string, string> = {
    admin: 'text-red-600',
    company_owner: 'text-blue-600',
    station_manager: 'text-amber-600',
    staff: 'text-purple-700',
    agent: 'text-green-700',
    technician: 'text-indigo-700',
    technician_partner: 'text-yellow-700',
    technician_assistant: 'text-indigo-600',
    private_provider: 'text-orange-600',
    investor: 'text-teal-700',
    customer: 'text-gray-700',
    city_driver: 'text-emerald-700',
    intercity_driver: 'text-cyan-700',
    delivery_partner: 'text-lime-700',
    intercity_bus: 'text-sky-700',
    vehicle_transport: 'text-blue-700',
    tour_guide: 'text-pink-700',
    other: 'text-slate-700',
  };

  const roleCounts = useMemo(() => {
    const acc: Record<string, number> = {};
    let other = 0;
    for (const u of users) {
      const k = String(u.role || '').toLowerCase().trim();
      if (!k) continue;
      if (roleSet.has(k as RoleKey)) acc[k] = (acc[k] || 0) + 1;
      else other += 1;
    }
    if (other > 0) acc.other = other;
    return acc;
  }, [users, roleSet]);

  // ===== Business Types =====
  const businessTypeOrder: BusinessType[] = [
    'rental_company',
    'private_provider',
    'agent',
    'technician_partner',
    'city_driver',
    'intercity_driver',
    'delivery_partner',
    'intercity_bus',
    'vehicle_transport',
    'tour_guide',
  ];

  const businessTypeLabels: Record<BusinessType, string> = {
    rental_company: td('business_types.rental_company', 'Rental Company'),
    private_provider: td('business_types.private_provider', 'Private Vehicle Provider'),
    agent: td('business_types.agent', 'Agent'),
    technician_partner: td('business_types.technician_partner', 'Technician Partner'),
    city_driver: td('business_types.city_driver', 'City Driver'),
    intercity_driver: td('business_types.intercity_driver', 'Intercity Driver'),
    delivery_partner: td('business_types.delivery_partner', 'Delivery Partner'),
    intercity_bus: td('business_types.intercity_bus', 'Intercity Bus Company'),
    vehicle_transport: td('business_types.vehicle_transport', 'Vehicle Transporter'),
    tour_guide: td('business_types.tour_guide', 'Tour Guide'),
  };

  const businessTypeColors: Record<BusinessType, string> = {
    rental_company: 'text-emerald-700',
    private_provider: 'text-orange-600',
    agent: 'text-green-700',
    technician_partner: 'text-yellow-700',
    city_driver: 'text-emerald-700',
    intercity_driver: 'text-cyan-700',
    delivery_partner: 'text-lime-700',
    intercity_bus: 'text-sky-700',
    vehicle_transport: 'text-blue-700',
    tour_guide: 'text-pink-700',
  };


  const totalUsers = users.length;

  return (
    <div className="space-y-4">
      {/* Row 1: Total & by Role */}
      <div className="mb-2 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6">
        <div className="rounded-lg border bg-white p-3 text-center shadow-sm">
          <h3 className="text-xs text-gray-500">{td('user_summary.total', 'Total Users')}</h3>
          <p className="text-xl font-bold text-[#00d289]">{totalUsers}</p>
        </div>

        {roleOrder.map((key) => (
          <div key={key} className="rounded-lg border bg-white p-3 text-center shadow-sm">
            <h3 className="truncate text-xs text-gray-500">{roleLabels[key]}</h3>
            <p className={`text-xl font-bold ${roleColors[key]}`}>{roleCounts[key] || 0}</p>
          </div>
        ))}

        {'other' in roleCounts && (
          <div className="rounded-lg border bg-white p-3 text-center shadow-sm">
            <h3 className="truncate text-xs text-gray-500">{roleLabels.other}</h3>
            <p className={`text-xl font-bold ${roleColors.other}`}>{roleCounts.other || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}
