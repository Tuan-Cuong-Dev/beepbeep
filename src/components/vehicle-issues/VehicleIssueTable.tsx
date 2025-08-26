'use client';

import { useTranslation } from 'react-i18next';
import type { ExtendedVehicleIssue, VehicleIssueStatus } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import type { JSX } from 'react';
import { CheckCircle2, XCircle, UserPlus, FileText, Send } from 'lucide-react';

interface Props {
  issues: ExtendedVehicleIssue[];
  technicianMap: Record<string, string>;
  onEdit: (issue: ExtendedVehicleIssue) => void;

  updateIssue: (id: string, data: Partial<ExtendedVehicleIssue>) => Promise<void>;

  setClosingIssue: (issue: ExtendedVehicleIssue | null) => void;
  setCloseDialogOpen: (open: boolean) => void;
  setEditingIssue: (issue: ExtendedVehicleIssue | null) => void;
  setShowForm: (open: boolean) => void;

  normalizedRole: string;
  isAdmin: boolean;
  isTechnician?: boolean;
  isTechnicianPartner?: boolean;

  setProposingIssue?: (issue: ExtendedVehicleIssue | null) => void;
  setUpdatingActualIssue?: (issue: ExtendedVehicleIssue | null) => void;

  searchTerm: string;
  statusFilter: string;
  stationFilter: string;
  refetchIssues: () => Promise<void>;

  setViewingProposal: (issue: ExtendedVehicleIssue | null) => void;
  setApprovingProposal: (issue: ExtendedVehicleIssue | null) => void;
}

export default function VehicleIssueTable({
  issues,
  technicianMap: _technicianMap,
  onEdit: _onEdit,
  updateIssue,
  setClosingIssue,
  setCloseDialogOpen,
  setEditingIssue,
  setShowForm,
  normalizedRole: _normalizedRole,
  isAdmin: _isAdmin,
  isTechnician,
  isTechnicianPartner,
  setProposingIssue,
  setUpdatingActualIssue,
  setViewingProposal,
  setApprovingProposal,
}: Props) {
  const { t } = useTranslation('common');
  const isTechOrPartner = !!isTechnician || !!isTechnicianPartner;

  // ======= UI helpers =======
  const StatusBadge = ({ status }: { status: VehicleIssueStatus }) => {
    const colorMap: Record<VehicleIssueStatus, string> = {
      pending: 'bg-gray-500',
      assigned: 'bg-blue-600',
      proposed: 'bg-amber-500',
      confirmed: 'bg-emerald-600',
      rejected: 'bg-rose-600',
      in_progress: 'bg-indigo-600',
      resolved: 'bg-violet-600',
      closed: 'bg-zinc-900',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-white ${colorMap[status]}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-white/90" />
        {t(`status.${status}`, { defaultValue: status.replace('_', ' ') })}
      </span>
    );
  };

  const getTranslatedIssueType = (rawType: string) => {
    const normalized = rawType?.toLowerCase().replace(/\s+/g, '_');
    return t(`vehicle_issue_type.${normalized}`, { defaultValue: rawType });
  };

  // ---------- Mini button system ----------
  type ActionVariant = 'assign' | 'approve' | 'close' | 'submitProposal' | 'submitActual' | 'view';

  const variantStyles: Record<ActionVariant, { className: string; icon?: JSX.Element }> = {
    assign: {
      className: 'border-[#00d289] text-[#00d289] hover:bg-[#00d289]/10',
      icon: <UserPlus className="size-4" />,
    },
    approve: {
      className: 'border-blue-500 text-blue-600 hover:bg-blue-50',
      icon: <CheckCircle2 className="size-4" />,
    },
    close: {
      className: 'bg-rose-600 text-white hover:bg-rose-700',
      icon: <XCircle className="size-4" />,
    },
    submitProposal: {
      className: 'bg-amber-500 text-white hover:bg-amber-600',
      icon: <Send className="size-4" />,
    },
    submitActual: {
      className: 'bg-violet-600 text-white hover:bg-violet-700',
      icon: <Send className="size-4" />,
    },
    view: {
      className: 'text-[#00d289] hover:text-[#00b574] hover:underline',
      icon: <FileText className="size-4" />,
    },
  };

  function ActionButton({
    variant,
    children,
    onClick,
  }: {
    variant: ActionVariant;
    children: React.ReactNode;
    onClick: () => void;
  }) {
    const v = variantStyles[variant];
    const base = 'h-8 px-2.5 sm:px-3 text-xs sm:text-sm rounded-md whitespace-nowrap inline-flex items-center gap-1.5';
    if (variant === 'approve' || variant === 'assign') {
      return (
        <Button size="sm" variant="outline" className={`${base} ${v.className}`} onClick={onClick}>
          {v.icon}
          {children}
        </Button>
      );
    }
    if (variant === 'view') {
      return (
        <Button size="sm" variant="ghost" className={`${base} ${v.className}`} onClick={onClick}>
          {v.icon}
          {children}
        </Button>
      );
    }
    return (
      <Button size="sm" className={`${base} ${v.className}`} onClick={onClick}>
        {v.icon}
        {children}
      </Button>
    );
  }

  // ---------- Actions by role/status ----------
  const renderActions = (issue: ExtendedVehicleIssue) => {
    const buttons: JSX.Element[] = [];

    if (isTechOrPartner) {
      // 👨‍🔧 Role: Technician / Technician Partner
      if (issue.status === 'assigned') {
        buttons.push(
          <ActionButton key="submitProposal" variant="submitProposal" onClick={() => setProposingIssue?.(issue)}>
            {t('vehicle_issue_table.submit_proposal')}
          </ActionButton>,
        );
      }
      if (issue.status === 'confirmed') {
        buttons.push(
          <ActionButton key="submitActual" variant="submitActual" onClick={() => setUpdatingActualIssue?.(issue)}>
            {t('vehicle_issue_table.submit_actual')}
          </ActionButton>,
        );
      }
    } else {
      // 👩‍💼 Managerial roles (admin/company/station)
      if (issue.status === 'proposed') {
        buttons.push(
          <ActionButton key="approve" variant="approve" onClick={() => setApprovingProposal(issue)}>
            {t('vehicle_issue_table.approve_proposal')}
          </ActionButton>,
        );
      }
      if (issue.status === 'resolved') {
        buttons.push(
          <ActionButton
            key="close"
            variant="close"
            onClick={() => {
              setClosingIssue(issue);
              setCloseDialogOpen(true);
            }}
          >
            {t('vehicle_issue_table.close')}
          </ActionButton>,
        );
      }
      // Assign technician (thay cho Edit)
      buttons.push(
        <ActionButton
          key="assign"
          variant="assign"
          onClick={() => {
            setEditingIssue(issue);
            setShowForm(true);
          }}
        >
          {t('vehicle_issue_table.assign')}
        </ActionButton>,
      );
    }

    // 👀 View proposal: mọi vai trò đều xem được nếu có đề xuất
    if (issue.proposedSolution) {
      buttons.push(
        <ActionButton key="viewProposal" variant="view" onClick={() => setViewingProposal(issue)}>
          {t('vehicle_issue_table.view_proposal')}
        </ActionButton>,
      );
    }

    return buttons.length > 0 ? (
      <div className="flex flex-row flex-wrap items-center gap-2 max-w-full" style={{ rowGap: '0.5rem' }}>
        {buttons}
      </div>
    ) : (
      <span className="text-gray-400 italic">{t('vehicle_issue_table.no_actions')}</span>
    );
  };

  // ---------- Render ----------
  return (
    <>
      {/* ✅ Mobile Card View */}
      <div className="grid gap-4 sm:hidden">
        {issues.map((issue) => (
          <div key={issue.id} className="border rounded-lg p-4 bg-white shadow space-y-2">
            <div className="font-semibold text-base text-blue-600">{issue.vin}</div>

            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.plate')}: {issue.plateNumber}
            </div>
            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.station')}: {issue.stationName}
            </div>
            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.type')}: {getTranslatedIssueType(issue.issueType)}
            </div>
            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.description')}: {issue.description || '-'}
            </div>
            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.status')}: <StatusBadge status={issue.status} />
            </div>
            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.assigned_to')}: {issue.assignedToName || '-'}
            </div>
            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.proposal')}: {issue.proposedSolution || '-'}
            </div>
            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.actual')}: {issue.actualSolution || '-'}
            </div>
            <div className="text-sm text-gray-600">
              {t('vehicle_issue_table.reported')}: {safeFormatDate(issue.reportedAt)}
            </div>

            <div className="pt-2">{renderActions(issue)}</div>
          </div>
        ))}
      </div>

      {/* ✅ Desktop Table View */}
      <div className="hidden sm:block overflow-auto border rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">{t('vehicle_issue_table.vin')}</th>
              <th className="p-2">{t('vehicle_issue_table.plate')}</th>
              <th className="p-2">{t('vehicle_issue_table.type')}</th>
              <th className="p-2">{t('vehicle_issue_table.description')}</th>
              <th className="p-2">{t('vehicle_issue_table.status')}</th>
              <th className="p-2">{t('vehicle_issue_table.assigned_to')}</th>
              <th className="p-2">{t('vehicle_issue_table.proposal')}</th>
              <th className="p-2">{t('vehicle_issue_table.actual')}</th>
              <th className="p-2">{t('vehicle_issue_table.reported')}</th>
              <th className="p-2">{t('vehicle_issue_table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{issue.vin}</td>
                <td className="p-2">{issue.plateNumber}</td>
                <td className="p-2">{getTranslatedIssueType(issue.issueType)}</td>
                <td className="p-2">{issue.description || '-'}</td>
                <td className="p-2">
                  <StatusBadge status={issue.status} />
                </td>
                <td className="p-2">{issue.assignedToName || '-'}</td>
                <td className="p-2">{issue.proposedSolution || '-'}</td>
                <td className="p-2">{issue.actualSolution || '-'}</td>
                <td className="p-2">{safeFormatDate(issue.reportedAt)}</td>
                <td className="p-2">{renderActions(issue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
