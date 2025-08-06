'use client';

import React from 'react';
import { Staff } from '@/src/lib/staff/staffTypes';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  staffs: Staff[];
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  stationMap?: Record<string, string>;
  companyNames?: Record<string, string>;
}

export default function StaffTableMobile({
  staffs,
  onEdit,
  onDelete,
  stationMap = {},
  companyNames = {},
}: Props) {
  const { t } = useTranslation('common');

  const getRoleBadge = (role: string) => {
    const base = 'px-2 py-1 rounded-full text-xs font-semibold';
    const map: Record<string, string> = {
      admin: 'bg-red-100 text-red-600',
      company_owner: 'bg-blue-100 text-blue-600',
      company_admin: 'bg-green-100 text-green-600',
      technician: 'bg-yellow-100 text-yellow-700',
      support: 'bg-purple-100 text-purple-600',
      staff: 'bg-gray-100 text-gray-600',
    };
    return (
      <span className={`${base} ${map[role] || 'bg-gray-100 text-gray-500'}`}>
        {t(`staff.roles.${role}`, { defaultValue: role.replace(/_/g, ' ') })}
      </span>
    );
  };

  const getStatusBadge = (accepted: boolean | undefined) => {
    const key = accepted ? 'accepted' : 'pending';
    const color = accepted
      ? 'bg-green-100 text-green-700'
      : 'bg-yellow-100 text-yellow-700';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {t(`staff_table_mobile.status.${key}`)}
      </span>
    );
  };

  const getInitial = (name?: string, email?: string) => {
    const base = name || email || '';
    return base.charAt(0).toUpperCase();
  };

  if (!staffs.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        {t('staff_table_mobile.no_staff_found')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      {staffs.map((staff) => (
        <div
          key={staff.id}
          className="bg-white shadow-md rounded-xl p-4 text-sm space-y-2"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#00d289] text-white flex items-center justify-center font-bold">
              {getInitial(staff.name, staff.email)}
            </div>
            <div>
              <p className="font-medium text-gray-800">{staff.name || '—'}</p>
              <p className="text-xs text-gray-600">{staff.email}</p>
            </div>
          </div>

          <div className="flex justify-between">
            <div>
              {t('staff_table_mobile.role')}: {getRoleBadge(staff.role)}
            </div>
            <div>{getStatusBadge(staff.accepted)}</div>
          </div>

          <div className="text-xs text-gray-600">
            {t('staff_table_mobile.company')}: {companyNames[staff.companyId ?? ''] || '—'}
          </div>

          <div className="text-xs text-gray-600">
            {t('staff_table_mobile.station')}: {stationMap[staff.stationId ?? ''] || '—'}
          </div>

          <div className="flex gap-2 pt-2">
            {onEdit && (
              <Button size="sm" className="w-full" onClick={() => onEdit(staff)}>
                {t('staff_table_mobile.actions.edit')}
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => onDelete(staff)}
              >
                {t('staff_table_mobile.actions.delete')}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
