'use client';

import React from 'react';
import { Staff } from '@/src/lib/staff/staffTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  staffs: Staff[];
  onEdit?: (staff: Staff) => void;
  onDelete?: (staff: Staff) => void;
  stationMap?: Record<string, string>;
  companyNames?: Record<string, string>;
}

export default function StaffTable({
  staffs,
  onEdit,
  onDelete,
  stationMap = {},
  companyNames = {},
}: Props) {
  if (!staffs.length) {
    return (
      <div className="p-6 text-center text-gray-500">
        No staff members found.
      </div>
    );
  }

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
        {role.replace(/_/g, ' ')}
      </span>
    );
  };

  const getStatusBadge = (accepted: boolean | undefined) => {
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${
          accepted ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
        }`}
      >
        {accepted ? 'Accepted' : 'Pending'}
      </span>
    );
  };

  const getInitial = (name?: string, email?: string) => {
    const base = name || email || '';
    return base.charAt(0).toUpperCase();
  };

  return (
    <div className="overflow-auto border rounded-xl shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
          <tr>
            <th className="p-3">Staff</th>
            <th className="p-3">Email</th>
            <th className="p-3">Role</th>
            <th className="p-3">Company</th>
            <th className="p-3">Station</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {staffs.map((staff) => (
            <tr key={staff.id} className="hover:bg-gray-50 transition">
              <td className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#00d289] text-white flex items-center justify-center font-bold">
                    {getInitial(staff.name, staff.email)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{staff.name || '—'}</p>
                  </div>
                </div>
              </td>
              <td className="p-3">{staff.email}</td>
              <td className="p-3">{getRoleBadge(staff.role)}</td>
              <td className="p-3">{companyNames[staff.companyId ?? ''] || '—'}</td>
              <td className="p-3">{stationMap[staff.stationId ?? ''] || '—'}</td>
              <td className="p-3">{getStatusBadge(staff.accepted)}</td>
              <td className="p-3 text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <Button size="sm" onClick={() => onEdit(staff)}>
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(staff)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
