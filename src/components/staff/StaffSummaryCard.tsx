'use client';

import { Staff } from '@/src/lib/staff/staffTypes';
import { Briefcase, CheckCircle, Clock, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  staffs: Staff[];
}

export default function StaffSummaryCard({ staffs }: Props) {
  const { t } = useTranslation('common');

  const total = staffs.length;
  const accepted = staffs.filter((s) => s.accepted).length;
  const pending = total - accepted;

  const roles = staffs.reduce((acc: Record<string, number>, staff) => {
    acc[staff.role] = (acc[staff.role] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
        <Users className="w-8 h-8 text-[#00d289]" />
        <div>
          <p className="text-sm text-gray-500">{t('staff_summary_card.total_staff')}</p>
          <p className="text-xl font-bold text-gray-800">{total}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
        <CheckCircle className="w-8 h-8 text-green-500" />
        <div>
          <p className="text-sm text-gray-500">{t('staff_summary_card.accepted')}</p>
          <p className="text-xl font-bold text-gray-800">{accepted}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm flex items-center gap-4">
        <Clock className="w-8 h-8 text-yellow-500" />
        <div>
          <p className="text-sm text-gray-500">{t('staff_summary_card.pending')}</p>
          <p className="text-xl font-bold text-gray-800">{pending}</p>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Briefcase className="w-5 h-5 text-blue-500" />
          <p className="text-sm font-semibold text-gray-700">{t('staff_summary_card.by_role')}</p>
        </div>
        <ul className="space-y-1 text-sm text-gray-600">
          {Object.entries(roles).map(([role, count]) => (
            <li key={role} className="flex justify-between">
              <span>{t(`staff_summary_card.roles.${role}`, { defaultValue: role })}</span>
              <span className="font-semibold">{count}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
