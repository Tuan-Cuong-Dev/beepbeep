// 📁 components/profile/MyIssuesSection.tsx
'use client';

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { formatCurrency } from '@/src/utils/formatCurrency';

function statusBadgeClass(status?: string) {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'assigned': return 'bg-blue-100 text-blue-800';
    case 'proposed': return 'bg-indigo-100 text-indigo-800';
    case 'confirmed': return 'bg-emerald-100 text-emerald-800';
    case 'rejected': return 'bg-rose-100 text-rose-800';
    case 'in_progress': return 'bg-sky-100 text-sky-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-gray-200 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function toDate(value?: any): Date | null {
  if (!value) return null;
  if (typeof value?.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function formatDateTime(value?: any, locale = 'vi-VN'): string {
  const d = toDate(value);
  if (!d) return '-';
  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface Props {
  issues: PublicVehicleIssue[];
}

export default function MyIssuesSection({ issues }: Props) {
  const { t, i18n } = useTranslation('common');
  const locale = i18n.language || 'vi-VN';
  const NA = t('my_issues_section.na', 'N/A');

  const stats = useMemo(() => {
    const total = issues.length;
    const by = (key: string) => issues.filter(i => i.status === (key as any)).length;
    return { total, pending: by('pending'), in_progress: by('in_progress'), resolved: by('resolved'), closed: by('closed') };
  }, [issues]);

  return (
    <div className="p-4 border-t space-y-4">
      {/* Quick stats */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">{t('my_issues_section.title')}</h2>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 rounded bg-gray-100">
            {t('my_issues_section.stats.total')}: {stats.total}
          </span>
          <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">
            {t('status.pending', 'Pending')}: {stats.pending}
          </span>
          <span className="px-2 py-1 rounded bg-sky-100 text-sky-800">
            {t('status.in_progress', 'In Progress')}: {stats.in_progress}
          </span>
          <span className="px-2 py-1 rounded bg-green-100 text-green-800">
            {t('status.resolved', 'Resolved')}: {stats.resolved}
          </span>
          <span className="px-2 py-1 rounded bg-gray-200 text-gray-800">
            {t('status.closed', 'Closed')}: {stats.closed}
          </span>
        </div>
      </div>

      {issues.length === 0 ? (
        <p className="text-sm text-gray-500">{t('my_issues_section.no_issues')}</p>
      ) : (
        <>
          {/* 📱 Mobile cards */}
          <div className="grid gap-3 md:hidden">
            {issues.map((i) => {
              const statusLabel = t(`status.${i.status}`, i.status);
              const approveStatusLabel = i.approveStatus ? t(`approve_status.${i.approveStatus}`, i.approveStatus) : NA;
              const vehicleName = [i.vehicleBrand, i.vehicleModel, i.vehicleLicensePlate].filter(Boolean).join(' ') || NA;
              return (
                <div key={i.id} className="rounded-lg border bg-white p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="font-medium line-clamp-2">{i.issueDescription || NA}</div>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusBadgeClass(i.status)}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-700 space-y-1">
                    <div>{t('my_issues_section.table.vehicle')}: {vehicleName}</div>
                    <div>{t('my_issues_section.table.location')}: {i.location?.mapAddress || i.location?.issueAddress || NA}</div>
                    <div>{t('my_issues_section.table.assigned_to')}: {i.assignedToName || NA}</div>
                    <div>{t('my_issues_section.table.proposed_cost')}: {i.proposedCost != null ? formatCurrency(i.proposedCost, locale) : NA}</div>
                    <div>{t('my_issues_section.table.actual_cost')}: {i.actualCost != null ? formatCurrency(i.actualCost, locale) : NA}</div>
                    <div>{t('my_issues_section.table.approve_status')}: {approveStatusLabel}</div>
                    <div className="text-gray-500">
                      {t('my_issues_section.table.reported_at')}: {formatDateTime(i.createdAt, locale)}
                      {i.updatedAt ? ` • ${t('my_issues_section.table.updated_at')}: ${formatDateTime(i.updatedAt, locale)}` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🖥️ Desktop table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-sm border bg-white">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2 border">{t('my_issues_section.table.vehicle')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.title')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.location')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.status')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.assigned_to')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.proposed_cost')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.actual_cost')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.approve_status')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.reported_at')}</th>
                  <th className="p-2 border">{t('my_issues_section.table.updated_at')}</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => {
                  const statusLabel = t(`status.${i.status}`, i.status);
                  const approveStatusLabel = i.approveStatus ? t(`approve_status.${i.approveStatus}`, i.approveStatus) : NA;
                  const vehicleName = [i.vehicleBrand, i.vehicleModel, i.vehicleLicensePlate].filter(Boolean).join(' ') || NA;
                  return (
                    <tr key={i.id} className="border-t align-top">
                      <td className="p-2 border-r text-xs">{vehicleName}</td>
                      <td className="p-2 border-r font-medium">{i.issueDescription || NA}</td>
                      <td className="p-2 border-r text-xs">{i.location?.mapAddress || i.location?.issueAddress || NA}</td>
                      <td className="p-2 border-r">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(i.status)}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="p-2 border-r text-xs">{i.assignedToName || NA}</td>
                      <td className="p-2 border-r text-xs">{i.proposedCost != null ? formatCurrency(i.proposedCost, locale) : NA}</td>
                      <td className="p-2 border-r text-xs">{i.actualCost != null ? formatCurrency(i.actualCost, locale) : NA}</td>
                      <td className="p-2 border-r text-xs">{approveStatusLabel}</td>
                      <td className="p-2 border-r text-xs">{formatDateTime(i.createdAt, locale)}</td>
                      <td className="p-2 text-xs">{i.updatedAt ? formatDateTime(i.updatedAt, locale) : '-'}</td>
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
