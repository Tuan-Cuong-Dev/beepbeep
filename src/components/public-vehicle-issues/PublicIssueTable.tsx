'use client';

import { memo, useMemo } from 'react';
import { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/src/utils/formatCurrency';
import clsx from 'clsx';

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

/* ---------- Utils & small UI atoms ---------- */
const safe = (v?: string | number | null) => (v !== null && v !== undefined && v !== '' ? v : '-');
const fmtDate = (d?: any) => (d?.toDate ? format(d.toDate(), 'Pp') : '-');
const fmtMoney = (v?: number | string | null) =>
  v === null || v === undefined || v === '' ? '-' : formatCurrency(v);

const getCoordString = (loc?: any): string => {
  if (!loc) return '';
  if (typeof loc.coordinates === 'string' && loc.coordinates.trim()) return loc.coordinates.trim();
  if (typeof loc.lat === 'number' && typeof loc.lng === 'number') return `${loc.lat},${loc.lng}`;
  return '';
};
const mapsHref = (coordStr: string) =>
  coordStr ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(coordStr)}` : '';

function CellText({
  children,
  className,
  title,
}: {
  children: any;
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={clsx('truncate', className)}
      title={typeof title === 'string' ? title : typeof children === 'string' ? children : undefined}
    >
      {children}
    </div>
  );
}

function KeyVal({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx(className)}>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium">{children}</dd>
    </div>
  );
}

/* ---------- Status chip ---------- */
function StatusChipBase({
  status,
  label,
}: {
  status: PublicIssueStatus;
  label: string;
}) {
  const colorMap: Record<PublicIssueStatus, string> = {
    pending: 'bg-gray-200 text-gray-800',
    assigned: 'bg-blue-100 text-blue-700',
    proposed: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-rose-100 text-rose-700',
    in_progress: 'bg-indigo-100 text-indigo-700',
    resolved: 'bg-purple-100 text-purple-700',
    closed: 'bg-zinc-200 text-zinc-800',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        colorMap[status],
      )}
    >
      {label}
    </span>
  );
}

/* ---------- Action buttons ---------- */
function ActionButtons({
  issue,
  t,
  isTechnician,
  setEditingIssue,
  setShowForm,
  updateIssue,
  setProposingIssue,
  setUpdatingActualIssue,
  setViewingProposal,
  setApprovingProposal,
  setClosingIssue,
  setCloseDialogOpen,
}: {
  issue: PublicVehicleIssue;
  t: (k: string, o?: any) => string;
  isTechnician?: boolean;
  setEditingIssue: (issue: PublicVehicleIssue | null) => void;
  setShowForm: (open: boolean) => void;
  updateIssue: (id: string, data: Partial<PublicVehicleIssue>) => Promise<void>;
  setProposingIssue?: (issue: PublicVehicleIssue | null) => void;
  setUpdatingActualIssue?: (issue: PublicVehicleIssue | null) => void;
  setViewingProposal: (issue: PublicVehicleIssue | null) => void;
  setApprovingProposal: (issue: PublicVehicleIssue | null) => void;
  setClosingIssue: (issue: PublicVehicleIssue | null) => void;
  setCloseDialogOpen: (open: boolean) => void;
}) {
  const btn = 'whitespace-nowrap'; // luôn 1 dòng
  const wrap = 'flex flex-wrap items-start gap-2';

  if (isTechnician) {
    return (
      <div className={wrap}>
        {issue.status === 'assigned' && (
          <Button size="sm" className={btn} onClick={() => setProposingIssue?.(issue)}>
            {t('btn_submit_proposal')}
          </Button>
        )}
        {issue.status === 'confirmed' && (
          <Button
            size="sm"
            className={btn}
            onClick={() => updateIssue(issue.id!, { status: 'in_progress' })}
          >
            {t('btn_mark_in_progress')}
          </Button>
        )}
        {issue.status === 'in_progress' && (
          <Button size="sm" className={btn} onClick={() => setUpdatingActualIssue?.(issue)}>
            {t('btn_submit_actual')}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={wrap}>
      {(issue.status === 'pending' || issue.status === 'assigned') && (
        <Button
          size="sm"
          variant="outline"
          className={btn}
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
          <Button size="sm" variant="outline" className={btn} onClick={() => setViewingProposal(issue)}>
            {t('btn_view_proposal')}
          </Button>
          <Button size="sm" variant="success" className={btn} onClick={() => setApprovingProposal(issue)}>
            {t('btn_approve_reject')}
          </Button>
        </>
      )}

      {issue.status === 'resolved' && (
        <Button
          size="sm"
          variant="outline"
          className={btn}
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
}

/* ---------- Main ---------- */
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

  const Empty = (
    <div className="p-10 text-center text-sm text-gray-500">
      {t('empty', { defaultValue: 'No records' })}
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Desktop table */}
      <div className="hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr className="*:[&>th]:px-3 *:[&>th]:py-2 *:[&>th]:text-left *:[&>th]:font-semibold">
                <th className="sticky left-0 z-10 rounded-tl-2xl bg-gray-50">{t('col_customer')}</th>
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
                <th className="w-[220px]">{t('col_actual')}</th>
                <th className="w-[120px]">{t('col_actual_cost')}</th>
                <th>{t('col_reported')}</th>
                <th>{t('col_updated')}</th>
                <th>{t('col_closed_by')}</th>
                <th>{t('col_closed_at')}</th>
                <th className="sticky right-0 z-10 rounded-tr-2xl bg-gray-50 w-[260px]">
                  {t('col_actions')}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {issues.length === 0 && (
                <tr>
                  <td colSpan={19}>{Empty}</td>
                </tr>
              )}

              {issues.map((issue, idx) => (
                <tr
                  key={issue.id}
                  className={clsx('hover:bg-gray-50', idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50')}
                >
                  {/* sticky first cell */}
                  <td className="sticky left-0 z-10 bg-inherit px-3 py-3 font-medium text-gray-800">
                    <CellText>{safe(issue.customerName)}</CellText>
                    <div className="text-xs text-gray-500">{safe(issue.phone)}</div>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.phone)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.vehicleLicensePlate)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.vehicleBrand)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.vehicleModel)}</td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[220px] text-red-500">{safe(issue.issueDescription)}</CellText>
                  </td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[160px]">{safe(issue.location?.coordinates)}</CellText>
                  </td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[260px]">{safe(issue.location?.issueAddress)}</CellText>
                  </td>

                  <td className="px-3 py-3">
                    <StatusChipBase status={issue.status} label={t(`status.${issue.status}`)} />
                  </td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[180px]">{safe(issue.assignedToName)}</CellText>
                  </td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[220px] text-[#00d289]">{safe(issue.proposedSolution)}</CellText>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">{fmtMoney(issue.proposedCost)}</td>

                  <td className="px-3 py-3">
                    <CellText className="max-w-[220px]">{safe(issue.actualSolution)}</CellText>
                  </td>

                  <td className="px-3 py-3 whitespace-nowrap">{fmtMoney(issue.actualCost)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmtDate(issue.createdAt)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmtDate(issue.updatedAt)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{safe(issue.closedByName)}</td>
                  <td className="px-3 py-3 whitespace-nowrap">{fmtDate(issue.closedAt)}</td>

                  <td className="sticky right-0 z-10 bg-inherit px-3 py-3">
                    <ActionButtons
                      issue={issue}
                      t={t}
                      isTechnician={isTechnician}
                      setEditingIssue={setEditingIssue}
                      setShowForm={setShowForm}
                      updateIssue={updateIssue}
                      setProposingIssue={setProposingIssue}
                      setUpdatingActualIssue={setUpdatingActualIssue}
                      setViewingProposal={setViewingProposal}
                      setApprovingProposal={setApprovingProposal}
                      setClosingIssue={setClosingIssue}
                      setCloseDialogOpen={setCloseDialogOpen}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-gray-100 lg:hidden">
        {issues.length === 0 && Empty}

        {issues.map((issue) => {
          const coordStr = getCoordString(issue.location);
          return (
            <div key={issue.id} className="p-4">
              <div className="rounded-lg border bg-white p-4 shadow-sm">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{safe(issue.customerName)}</div>
                    <div className="mt-1">
                      {issue.phone ? (
                        <a
                          href={`tel:${issue.phone}`}
                          className="text-base font-semibold text-blue-600 underline decoration-dotted underline-offset-2"
                        >
                          {safe(issue.phone)}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </div>
                  </div>
                  <StatusChipBase status={issue.status} label={t(`status.${issue.status}`)} />
                </div>

                {/* Detail */}
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <KeyVal label={t('col_plate')}>{safe(issue.vehicleLicensePlate)}</KeyVal>
                  <KeyVal label={t('col_brand')}>{safe(issue.vehicleBrand)}</KeyVal>
                  <KeyVal label={t('col_model')}>{safe(issue.vehicleModel)}</KeyVal>

                  <div className="col-span-2">
                    <dt className="text-gray-500">{t('col_description')}</dt>
                    <dd className="font-medium text-red-500">{safe(issue.issueDescription)}</dd>
                  </div>

                  <div className="col-span-2">
                    <dt className="text-gray-500">{t('col_address')}</dt>
                    <dd className="font-medium">{safe(issue.location?.issueAddress)}</dd>
                  </div>

                  <div className="col-span-2">
                    <dt className="text-gray-500">{t('col_coordinates')}</dt>
                    <dd className="font-medium">
                      {coordStr ? (
                        <a
                          href={mapsHref(coordStr)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-dotted underline-offset-2"
                        >
                          <span className="font-mono">{coordStr}</span>
                          <span className="ml-2 text-xs text-blue-600">
                            {t('open_in_maps', { defaultValue: 'Open in Maps' })}
                          </span>
                        </a>
                      ) : (
                        '-'
                      )}
                    </dd>
                  </div>

                  <KeyVal label={t('col_assigned')}>{safe(issue.assignedToName)}</KeyVal>

                  <div className="col-span-2">
                    <dt className="text-gray-500">{t('col_proposal')}</dt>
                    <dd>
                      <CellText className="max-w-[220px] text-[#00d289]">
                        {safe(issue.proposedSolution)}
                      </CellText>
                    </dd>
                  </div>
                  <KeyVal label={t('col_proposed_cost')}>{fmtMoney(issue.proposedCost)}</KeyVal>

                  <div className="col-span-2">
                    <dt className="text-gray-500">{t('col_actual')}</dt>
                    <dd>
                      <CellText className="max-w-[220px]">{safe(issue.actualSolution)}</CellText>
                    </dd>
                  </div>
                  <KeyVal label={t('col_actual_cost')}>{fmtMoney(issue.actualCost)}</KeyVal>

                  <KeyVal label={t('col_reported')}>{fmtDate(issue.createdAt)}</KeyVal>
                </dl>

                {/* Actions */}
                <div className="mt-4">
                  <ActionButtons
                    issue={issue}
                    t={t}
                    isTechnician={isTechnician}
                    setEditingIssue={setEditingIssue}
                    setShowForm={setShowForm}
                    updateIssue={updateIssue}
                    setProposingIssue={setProposingIssue}
                    setUpdatingActualIssue={setUpdatingActualIssue}
                    setViewingProposal={setViewingProposal}
                    setApprovingProposal={setApprovingProposal}
                    setClosingIssue={setClosingIssue}
                    setCloseDialogOpen={setCloseDialogOpen}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const PublicIssueTable = memo(PublicIssueTableBase);
export default PublicIssueTable;
