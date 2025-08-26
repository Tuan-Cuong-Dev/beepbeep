// 📁 components/profile/MyIssuesSection.tsx
'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { formatCurrency } from '@/src/utils/formatCurrency';

interface Props {
  issues: PublicVehicleIssue[];
}

/** Badge cho trạng thái chính của issue */
function statusBadgeClass(status?: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'assigned':
      return 'bg-blue-100 text-blue-800';
    case 'proposed':
      return 'bg-indigo-100 text-indigo-800';
    case 'confirmed':
      return 'bg-emerald-100 text-emerald-800';
    case 'rejected':
      return 'bg-rose-100 text-rose-800';
    case 'in_progress':
      return 'bg-sky-100 text-sky-800';
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-200 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/** Badge cho approveStatus của đề xuất */
function approveBadgeClass(s?: 'pending' | 'approved' | 'rejected') {
  switch (s) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-rose-100 text-rose-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export default function MyIssuesSection({ issues }: Props) {
  const { t } = useTranslation('common');

  const stats = useMemo(() => {
    const total = issues.length;
    const by = (key: string) => issues.filter(i => i.status === (key as any)).length;
    return {
      total,
      pending: by('pending'),
      in_progress: by('in_progress'),
      resolved: by('resolved'),
      closed: by('closed'),
    };
  }, [issues]);

  const NA = t('my_issues_section.na');

  return (
    <div className="p-4 border-t space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">{t('my_issues_section.title')}</h2>
        {/* Quick stats */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-gray-100">{t('my_issues_section.stats.total', 'Total')}: {stats.total}</span>
          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">{t('status.pending', 'pending')}: {stats.pending}</span>
          <span className="px-2 py-1 rounded bg-sky-100 text-sky-800">{t('status.in_progress', 'in_progress')}: {stats.in_progress}</span>
          <span className="px-2 py-1 rounded bg-green-100 text-green-800">{t('status.resolved', 'resolved')}: {stats.resolved}</span>
          <span className="px-2 py-1 rounded bg-gray-200 text-gray-800">{t('status.closed', 'closed')}: {stats.closed}</span>
        </div>
      </div>

      {issues.length === 0 ? (
        <p className="text-sm text-gray-500">{t('my_issues_section.no_issues')}</p>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {issues.map((i) => {
              const statusLabel = t(`status.${i.status}`, i.status);
              const approveLabel = i.approveStatus ? t(`approve_status.${i.approveStatus}`, i.approveStatus) : NA;
              return (
                <div key={i.id} className="rounded-lg border bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{i.issueDescription || NA}</div>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeClass(i.status)}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="mt-2 text-[13px] text-gray-700 space-y-1">
                    <div><span className="text-gray-500">{t('my_issues_section.table.customer')}:</span> {i.customerName || NA} {i.phone ? `• ${i.phone}` : ''}</div>
                    <div><span className="text-gray-500">{t('my_issues_section.table.vehicle')}:</span> {i.vehicleBrand || '-'} {i.vehicleModel || ''} {i.vehicleLicensePlate ? `• ${i.vehicleLicensePlate}` : ''}</div>
                    <div><span className="text-gray-500">{t('my_issues_section.table.location')}:</span> {i.location?.mapAddress || i.location?.issueAddress || NA}</div>
                    <div><span className="text-gray-500">{t('my_issues_section.table.assigned_to')}:</span> {i.assignedToName || NA}</div>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded px-2 py-0.5 bg-gray-50 border text-[11px]">
                        {t('my_issues_section.table.proposed_cost', 'Proposed')}: {i.proposedCost != null ? formatCurrency(i.proposedCost) : NA}
                      </span>
                      <span className="inline-flex rounded px-2 py-0.5 bg-gray-50 border text-[11px]">
                        {t('my_issues_section.table.actual_cost', 'Actual')}: {i.actualCost != null ? formatCurrency(i.actualCost) : NA}
                      </span>
                      <span className={`inline-flex rounded px-2 py-0.5 border text-[11px] ${approveBadgeClass(i.approveStatus)}`}>
                        {t('my_issues_section.table.approve_status', 'Approval')}: {approveLabel}
                      </span>
                    </div>
                    <div className="text-[12px] text-gray-500">
                      {t('my_issues_section.table.reported_at')} {i.createdAt ? safeFormatDate(i.createdAt) : NA}
                      {i.updatedAt ? ` • ${t('my_issues_section.table.updated_at', 'Updated')} ${safeFormatDate(i.updatedAt)}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm border bg-white">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2 border">{t('my_issues_section.table.title')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.customer')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.vehicle')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.location')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.status')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.assigned_to')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.proposed_cost', 'Proposed')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.actual_cost', 'Actual')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.reported_at')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.updated_at', 'Updated')}</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => {
                  const statusLabel = t(`status.${i.status}`, i.status);
                  const approveLabel = i.approveStatus ? t(`approve_status.${i.approveStatus}`, i.approveStatus) : NA;

                  return (
                    <tr key={i.id} className="border-t">
                      <td className="p-2 border-r align-top max-w-[280px]">
                        <div className="font-medium line-clamp-3">{i.issueDescription || NA}</div>
                      </td>
                      <td className="p-2 border-r align-top">
                        <div className="space-y-0.5">
                          <div className="font-medium">{i.customerName || NA}</div>
                          <div className="text-xs text-gray-600">{i.phone || ''}</div>
                        </div>
                      </td>
                      <td className="p-2 border-r align-top">
                        <div className="text-xs">
                          {(i.vehicleBrand || '-')}{i.vehicleModel ? ` ${i.vehicleModel}` : ''}
                          {i.vehicleLicensePlate ? <div className="text-gray-600">{i.vehicleLicensePlate}</div> : null}
                        </div>
                      </td>
                      <td className="p-2 border-r align-top">
                        <div className="text-xs text-gray-700">
                          {i.location?.mapAddress || i.location?.issueAddress || NA}
                        </div>
                      </td>
                      <td className="p-2 border-r align-top">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(i.status)}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-2 border-r align-top">
                        <div className="text-xs">{i.assignedToName || NA}</div>
                      </td>
                      <td className="p-2 border-r align-top">
                        <div className="text-xs">{i.proposedCost != null ? formatCurrency(i.proposedCost) : NA}</div>
                      </td>
                      <td className="p-2 border-r align-top">
                        <div className="text-xs">{i.actualCost != null ? formatCurrency(i.actualCost) : NA}</div>
                      </td>
                      <td className="p-2 border-r align-top">
                        <div className="text-xs">{i.createdAt ? safeFormatDate(i.createdAt) : NA}</div>
                      </td>
                      <td className="p-2 align-top">
                        <div className="text-xs">{i.updatedAt ? safeFormatDate(i.updatedAt) : '-'}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
