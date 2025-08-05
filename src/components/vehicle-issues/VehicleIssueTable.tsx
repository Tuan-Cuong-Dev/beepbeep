'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ExtendedVehicleIssue, VehicleIssueStatus } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import ViewProposalDialog from '@/src/components/vehicle-issues/ViewProposalDialog';
import ApproveProposalDialog from '@/src/components/vehicle-issues/ApproveProposalDialog';

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
  technicianMap,
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

  return (
    <>
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
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.reported')}: {issue.reportedAt?.toDate().toLocaleString()}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              <div className="flex flex-wrap gap-2 pt-2">
                  {/* 👨‍🔧 Technician actions */}
                  {isTechnician && (
                    <>
                      {issue.status === 'assigned' && (
                        <Button size="sm" onClick={() => setProposingIssue?.(issue)}>
                          {t('vehicle_issue_table.submit_proposal')}
                        </Button>
                      )}
                      {issue.status === 'confirmed' && (
                        <Button size="sm" onClick={() => setUpdatingActualIssue?.(issue)}>
                          {t('vehicle_issue_table.submit_actual')}
                        </Button>
                      )}
                    </>
                  )}

                  {/* 👩‍💼 Admin/Company Owner actions */}
                  {!isTechnician && (
                    <>
                      {issue.status === 'proposed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setApprovingProposal(issue)}
                        >
                          {t('vehicle_issue_table.approve_proposal')}
                        </Button>
                      )}
                      {issue.status === 'resolved' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setClosingIssue(issue);
                            setCloseDialogOpen(true);
                          }}
                        >
                          {t('vehicle_issue_table.close_issue')}
                        </Button>
                      )}
                    </>
                  )}

                  {/* 👁️ View proposal */}
                  {issue.proposedSolution && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setViewingProposal(issue)}
                    >
                      {t('vehicle_issue_table.view_proposal')}
                    </Button>
                  )}

                  {/* ✏️ Edit */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingIssue(issue);
                      setShowForm(true);
                    }}
                  >
                    {t('vehicle_issue_table.edit')}
                  </Button>
                </div>
            </div>
          </div>
        ))}
      </div>

      <div className="hidden sm:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">{t('vehicle_issue_table.vin')}</th>
              <th className="p-2">{t('vehicle_issue_table.plate')}</th>
              <th className="p-2">{t('vehicle_issue_table.type')}</th>
              <th className="p-2">{t('vehicle_issue_table.description')}</th>
              <th className="p-2">{t('vehicle_issue_table.status')}</th>
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
                <td className="p-2">{issue.reportedAt?.toDate().toLocaleString()}</td>
                <td className="p-2 text-right text-gray-400 italic">{t('vehicle_issue_table.no_actions')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

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