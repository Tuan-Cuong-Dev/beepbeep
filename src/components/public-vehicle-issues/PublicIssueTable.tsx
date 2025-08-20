'use client';

import { memo, useMemo } from 'react';
import { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface Props {
  issues: PublicVehicleIssue[];
  onEdit: (issue: PublicVehicleIssue) => void;
  updateIssue: (id: string, data: Partial<PublicVehicleIssue>) => Promise<void>;
  setClosingIssue: (issue: PublicVehicleIssue | null) => void;
  setCloseDialogOpen: (open: boolean) => void;
  setEditingIssue: (issue: PublicVehicleIssue | null) => void;
  setShowForm: (open: boolean) => void;
  normalizedRole: string;
  isAdmin: boolean;
  isTechnician?: boolean;
  setProposingIssue?: (issue: PublicVehicleIssue | null) => void;
  setUpdatingActualIssue?: (issue: PublicVehicleIssue | null) => void;
  setViewingProposal: (issue: PublicVehicleIssue | null) => void;
  setApprovingProposal: (issue: PublicVehicleIssue | null) => void;
}

function PublicIssueTableBase({
  issues,
  updateIssue,
  setClosingIssue,
  setCloseDialogOpen,
  setEditingIssue,
  setShowForm,
  isTechnician,
  setProposingIssue,
  setUpdatingActualIssue,
  setViewingProposal,
  setApprovingProposal,
}: Props) {
  const { t } = useTranslation('common', { keyPrefix: 'public_issue_table' });

  const colorMap: Record<PublicIssueStatus, string> = useMemo(
    () => ({
      pending: 'bg-gray-200 text-gray-800',
      assigned: 'bg-blue-100 text-blue-700',
      proposed: 'bg-amber-100 text-amber-700',
      confirmed: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-rose-100 text-rose-700',
      in_progress: 'bg-indigo-100 text-indigo-700',
      resolved: 'bg-purple-100 text-purple-700',
      closed: 'bg-zinc-200 text-zinc-800',
    }),
    []
  );

  const safe = (v?: string | number | null) => (v !== null && v !== undefined && v !== '' ? v : '-');
  const fmt = (d?: any) => (d?.toDate ? format(d.toDate(), 'Pp') : '-');

  const StatusChip = ({ status }: { status: PublicIssueStatus }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status]}`}>
      {t(`status.${status}`)}
    </span>
  );

  const CellText = ({
    children,
    className = '',
    title,
  }: {
    children: any;
    className?: string;
    title?: string;
  }) => (
    <div
      className={['truncate', className].join(' ')}
      title={typeof title === 'string' ? title : typeof children === 'string' ? children : undefined}
    >
      {children}
    </div>
  );

  const renderActions = (issue: PublicVehicleIssue) => {
    if (isTechnician) {
      return (
        <div className="flex gap-2">
          {issue.status === 'assigned' && (
            <Button size="sm" onClick={() => setProposingIssue?.(issue)}>
              {t('btn_submit_proposal')}
            </Button>
          )}
          {issue.status === 'confirmed' && (
            <Button size="sm" onClick={() => updateIssue(issue.id!, { status: 'in_progress' })}>
              {t('btn_mark_in_progress')}
            </Button>
          )}
          {issue.status === 'in_progress' && (
            <Button size="sm" onClick={() => setUpdatingActualIssue?.(issue)}>
              {t('btn_submit_actual')}
            </Button>
          )}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        {(issue.status === 'pending' || issue.status === 'assigned') && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setEditingIssue(issue);
              setShowForm(true);
            }}
          >
            {t('btn_assign')}
          </Button>
        )}
        {issue.status === 'proposed' && (
          <>
            <Button size="sm" variant="outline" onClick={() => setViewingProposal(issue)}>
              {t('btn_view_proposal')}
            </Button>
            <Button size="sm" variant="success" onClick={() => setApprovingProposal(issue)}>
              {t('btn_approve_reject')}
            </Button>
          </>
        )}
        {issue.status === 'resolved' && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setClosingIssue(issue);
              setCloseDialogOpen(true);
            }}
          >
            {t('btn_close')}
          </Button>
        )}
      </div>
    );
  };

  const Empty = (
    <div className="p-10 text-center text-sm text-gray-500">{t('empty', { defaultValue: 'No records' })}</div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Desktop table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="*:[&>th]:px-3 *:[&>th]:py-2 *:[&>th]:font-semibold *:[&>th]:text-left">
                <th className="sticky left-0 bg-gray-50 z-10 rounded-tl-2xl">{t('col_customer')}</th>
                <th>{t('col_phone')}</th>
                <th>{t('col_plate')}</th>
                <th>{t('col_brand')}</th>
                <th>{t('col_model')}</th>
                <th className="w-[220px]">{t('col_description')}</th>
                <th className="w-[160px]">{t('col_coordinates')}</th>
                <th className="w-[260px]">{t('col_address')}</th>
                <th>{t('col_status')}</th>
                <th className="w-[180px]">{t('col_assigned')}</th>
                <th className="w-[220px]">{t('col_proposal')}</th>
                <th className="w-[120px]">{t('col_proposed_cost')}</th>
                <th className="w-[140px]">{t('col_approve_status')}</th>
                <th className="w-[220px]">{t('col_actual')}</th>
                <th className="w-[120px]">{t('col_actual_cost')}</th>
                <th>{t('col_reported')}</th>
                <th>{t('col_updated')}</th>
                <th>{t('col_closed_by')}</th>
                <th>{t('col_closed_at')}</th>
                <th className="w-[220px]">{t('col_close_comment')}</th>
                <th className="sticky right-0 bg-gray-50 z-10 rounded-tr-2xl">{t('col_actions')}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {issues.length === 0 && (
                <tr>
                  <td colSpan={22}>{Empty}</td>
                </tr>
              )}

              {issues.map((issue, idx) => (
                <tr
                  key={issue.id}
                  className={`hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  {/* Fixed first cell for easy reading while scrolling */}
                  <td className="px-3 py-3 sticky left-0 bg-inherit z-10 font-medium text-gray-800">
                    <CellText>{safe(issue.customerName)}</CellText>
                    <div className="text-xs text-gray-500">{safe(issue.phone)}</div>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.phone)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.vehicleLicensePlate)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.vehicleBrand)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.vehicleModel)}</td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[220px]">{safe(issue.issueDescription)}</CellText>
                  </td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[160px]">{safe(issue.location?.coordinates)}</CellText>
                  </td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[260px]">{safe(issue.location?.issueAddress)}</CellText>
                  </td>

                  <td className="px-3 py-3">
                    <StatusChip status={issue.status} />
                  </td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[180px]">{safe(issue.assignedToName)}</CellText>
                  </td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[220px]">{safe(issue.proposedSolution)}</CellText>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">{issue.proposedCost ?? '-'}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.approveStatus)}</td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[220px]">{safe(issue.actualSolution)}</CellText>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">{issue.actualCost ?? '-'}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmt(issue.createdAt)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmt(issue.updatedAt)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.closedByName)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmt(issue.closedAt)}</td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[220px]">{safe(issue.closeComment)}</CellText>
                  </td>

                  {/* Fixed action column on the right */}
                  <td className="px-3 py-3 sticky right-0 bg-inherit z-10">
                    {renderActions(issue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden divide-y divide-gray-100">
        {issues.length === 0 && Empty}

        {issues.map((issue) => (
          <div key={issue.id} className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-gray-900">{safe(issue.customerName)}</div>
                <div className="text-xs text-gray-500">{safe(issue.phone)}</div>
              </div>
              <StatusChip status={issue.status} />
            </div>

            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="text-gray-500">{t('col_plate')}</dt>
                <dd className="font-medium">{safe(issue.vehicleLicensePlate)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('col_brand')}</dt>
                <dd className="font-medium">{safe(issue.vehicleBrand)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('col_model')}</dt>
                <dd className="font-medium">{safe(issue.vehicleModel)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">{t('col_description')}</dt>
                <dd className="font-medium">{safe(issue.issueDescription)}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-gray-500">{t('col_address')}</dt>
                <dd className="font-medium">{safe(issue.location?.issueAddress)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('col_assigned')}</dt>
                <dd className="font-medium">{safe(issue.assignedToName)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">{t('col_reported')}</dt>
                <dd className="font-medium">{fmt(issue.createdAt)}</dd>
              </div>
            </dl>

            <div className="mt-3 flex flex-wrap gap-2">{renderActions(issue)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const PublicIssueTable = memo(PublicIssueTableBase);
export default PublicIssueTable;
