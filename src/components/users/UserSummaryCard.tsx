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
    technician_assistant: 'Technician Assistant',
    technician_partner: 'Technician Partner',
  };

  const roleColors: Record<string, string> = {
    admin: 'text-red-500',
    company_owner: 'text-blue-600',
    private_owner: 'text-orange-500',
    agent: 'text-green-600',
    staff: 'text-purple-600',
    investor: 'text-teal-500',
    customer: 'text-gray-700',
    technician_assistant: 'text-indigo-600',
    technician_partner: 'text-yellow-600',
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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4">
      <div className="bg-white rounded-lg border p-3 text-center shadow-sm">
        <h3 className="text-xs text-gray-500">Total Users</h3>
        <p className="text-xl font-bold text-[#00d289]">{totalUsers}</p>
      </div>

      {Object.entries(roleLabels).map(([roleKey, label]) => (
        <div
          key={roleKey}
          className="bg-white rounded-lg border p-3 text-center shadow-sm"
        >
          <h3 className="text-xs text-gray-500 truncate">{label}</h3>
          <p className={`text-xl font-bold ${roleColors[roleKey]}`}>
            {counts[roleKey] || 0}
          </p>
        </div>
      ))}
    </div>
  );
}
