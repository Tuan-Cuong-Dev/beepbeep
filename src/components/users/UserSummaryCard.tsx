'use client';

import { User } from '@/src/lib/users/userTypes';

interface Props {
  users: User[];
}

export default function UserSummaryCard({ users }: Props) {
  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    company_owner: 'Company Owner',
    private_owner: 'Private Owner',
    agent: 'Agent',
    staff: 'Staff',
    investor: 'Investor',
    customer: 'Customer',
  };

  const roleColors: Record<string, string> = {
    admin: 'text-red-500',
    company_owner: 'text-blue-600',
    private_owner: 'text-orange-500',
    agent: 'text-green-600',
    staff: 'text-purple-600',
    investor: 'text-teal-500',
    customer: 'text-gray-700',
  };

  const counts: Record<string, number> = {};
  users.forEach((user) => {
    const role = user.role?.toLowerCase();
    if (role && roleLabels[role]) {
      counts[role] = (counts[role] || 0) + 1;
    }
  });

  const totalUsers = users.length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white shadow rounded-xl p-4 text-center border">
        <h3 className="text-sm text-gray-500">Total Users</h3>
        <p className="text-2xl font-semibold text-[#00d289]">{totalUsers}</p>
      </div>

      {Object.entries(roleLabels).map(([roleKey, label]) => (
        <div
          key={roleKey}
          className="bg-white shadow rounded-xl p-4 text-center border"
        >
          <h3 className="text-sm text-gray-500">{label}</h3>
          <p className={`text-2xl font-semibold ${roleColors[roleKey]}`}>
            {counts[roleKey] || 0}
          </p>
        </div>
      ))}
    </div>
  );
}
