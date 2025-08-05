'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExtendedVehicleIssue, VehicleIssueStatus } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import ViewProposalDialog from '@/src/components/vehicle-issues/ViewProposalDialog';
import ApproveProposalDialog from '@/src/components/vehicle-issues/ApproveProposalDialog';
import { safeFormatDate } from '@/src/utils/safeFormatDate';

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
  const { t } = useTranslation('common');
  const [viewingProposal, setViewingProposalState] = useState<ExtendedVehicleIssue | null>(null);
  const [approvingProposal, setApprovingProposalState] = useState<ExtendedVehicleIssue | null>(null);

  const renderStatusBadge = (status: VehicleIssueStatus) => {
    const colorMap: Record<VehicleIssueStatus, string> = {
      pending: 'bg-gray-400',
      assigned: 'bg-blue-500',
      proposed: 'bg-yellow-500',
      confirmed: 'bg-green-500',
      rejected: 'bg-red-500',
      in_progress: 'bg-indigo-500',
      resolved: 'bg-purple-500',
      closed: 'bg-black',
    };

    return (
      <span className={`px-2 py-1 text-white rounded ${colorMap[status]}`}>
        {t(`status.${status}`, { defaultValue: status.replace('_', ' ') })}
      </span>
    );
  };

  const getTranslatedIssueType = (rawType: string) => {
    const normalized = rawType.toLowerCase().replace(/\s+/g, '_');
    return t(`vehicle_issue_type.${normalized}`, { defaultValue: rawType });
  };
  
  const renderActions = (issue: ExtendedVehicleIssue) => {
    const buttons = [];

    if (isTechnician) {
      if (issue.status === 'assigned') {
        buttons.push(
          <Button key="submitProposal" size="sm" onClick={() => setProposingIssue?.(issue)}>
            {t('vehicle_issue_table.submit_proposal')}
          </Button>
        );
      }
      if (issue.status === 'confirmed') {
        buttons.push(
          <Button key="submitActual" size="sm" onClick={() => setUpdatingActualIssue?.(issue)}>
            {t('vehicle_issue_table.submit_actual')}
          </Button>
        );
      }
    } else {
      if (issue.status === 'proposed') {
        buttons.push(
          <Button key="approve" size="sm" variant="outline" onClick={() => setApprovingProposal(issue)}>
            {t('vehicle_issue_table.approve_proposal')}
          </Button>
        );
      }
      if (issue.status === 'resolved') {
        buttons.push(
          <Button
            key="close"
            size="sm"
            variant="destructive"
            onClick={() => {
              setClosingIssue(issue);
              setCloseDialogOpen(true);
            }}
          >
            {t('vehicle_issue_table.close_issue')}
          </Button>
        );
      }
    }

    // ✅ "Xem đề xuất" - màu xanh, kiểu ghost
    if (issue.proposedSolution) {
      buttons.push(
        <Button
          key="viewProposal"
          size="sm"
          className="text-[#00d289] font-semibold hover:underline"
          variant="ghost"
          onClick={() => setViewingProposal(issue)}
        >
          {t('vehicle_issue_table.view_proposal')}
        </Button>
      );
    }

    // ✅ "Chỉnh sửa" - outline xanh
    buttons.push(
      <Button
        key="edit"
        size="sm"
        className="border-[#00d289] text-[#00d289] hover:bg-[#00d289]/10"
        variant="outline"
        onClick={() => {
          setEditingIssue(issue);
          setShowForm(true);
        }}
      >
        {t('vehicle_issue_table.edit')}
      </Button>
    );

    return buttons.length > 0 ? (
      <div className="flex flex-wrap gap-2">{buttons}</div>
    ) : (
      <span className="text-gray-400 italic">{t('vehicle_issue_table.no_actions')}</span>
    );
  };


  return (
    <>
      {/* ✅ Mobile Card View */}
      <div className="grid gap-4 sm:hidden">
        {issues.map((issue) => (
          <div key={issue.id} className="border rounded-lg p-4 bg-white shadow space-y-2">
            <div className="font-semibold text-base text-blue-600">{issue.vin}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.plate')}: {issue.plateNumber}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.station')}: {issue.stationName}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.type')}: {getTranslatedIssueType(issue.issueType)}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.description')}: {issue.description || '-'}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.status')}: {renderStatusBadge(issue.status)}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.assigned_to')}: {issue.assignedToName || '-'}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.proposal')}: {issue.proposedSolution || '-'}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.actual')}: {issue.actualSolution || '-'}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.reported')}: {safeFormatDate(issue.reportedAt)}</div>
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
                <td className="p-2">{renderStatusBadge(issue.status)}</td>
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

      {/* 🔍 Proposal Dialogs */}
      <ViewProposalDialog open={!!viewingProposal} issue={viewingProposal} onClose={() => setViewingProposalState(null)} />
      <ApproveProposalDialog
        open={!!approvingProposal}
        issue={approvingProposal}
        onClose={() => setApprovingProposalState(null)}
        onApprove={async () => {
          if (approvingProposal) {
            await updateIssue(approvingProposal.id, { status: 'confirmed' });
            setApprovingProposalState(null);
          }
        }}
        onReject={async (reason) => {
          if (approvingProposal) {
            await updateIssue(approvingProposal.id, {
              status: 'rejected',
              closeComment: reason,
            });
            setApprovingProposalState(null);
          }
        }}
      />
    </>
  );
}
