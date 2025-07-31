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
    return <span className={`px-2 py-1 text-white rounded ${colorMap[status]}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <>
      <div className="grid gap-4 sm:hidden">
        {issues.map((issue) => (
          <div key={issue.id} className="border rounded-lg p-4 bg-white shadow space-y-2">
            <div className="font-semibold text-base text-blue-600">{issue.vin}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.plate')}: {issue.plateNumber}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.station')}: {issue.stationName}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.type')}: {issue.issueType}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.description')}: {issue.description || '-'}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.status')}: {renderStatusBadge(issue.status)}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.assigned_to')}: {issue.assignedToName || '-'}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.proposal')}: {issue.proposedSolution || '-'}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.actual')}: {issue.actualSolution || '-'}</div>
            <div className="text-sm text-gray-600">{t('vehicle_issue_table.reported')}: {issue.reportedAt?.toDate().toLocaleString()}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              {isTechnician ? (
                <>
                  {issue.status === 'assigned' && (
                    <Button size="sm" onClick={() => setProposingIssue?.(issue)}>
                      {t('vehicle_issue_table.submit_proposal')}
                    </Button>
                  )}
                  {issue.status === 'confirmed' && (
                    <Button size="sm" onClick={() => updateIssue(issue.id, { status: 'in_progress' })}>
                      {t('vehicle_issue_table.mark_in_progress')}
                    </Button>
                  )}
                  {issue.status === 'in_progress' && (
                    <Button size="sm" onClick={() => setUpdatingActualIssue?.(issue)}>
                      {t('vehicle_issue_table.submit_actual')}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {(issue.status === 'pending' || issue.status === 'assigned') && (
                    <Button size="sm" variant="outline" onClick={() => { setEditingIssue(issue); setShowForm(true); }}>
                      {t('vehicle_issue_table.assign')}
                    </Button>
                  )}
                  {issue.status === 'proposed' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setViewingProposal(issue)}>
                        {t('vehicle_issue_table.view_proposal')}
                      </Button>
                      <Button size="sm" variant="success" onClick={() => setApprovingProposal(issue)}>
                        {t('vehicle_issue_table.approve_or_reject')}
                      </Button>
                    </>
                  )}
                  {issue.status === 'resolved' && (
                    <Button size="sm" variant="outline" onClick={() => { setClosingIssue(issue); setCloseDialogOpen(true); }}>
                      {t('vehicle_issue_table.close')}
                    </Button>
                  )}
                </>
              )}
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
              <th className="p-2">{t('vehicle_issue_table.station')}</th>
              <th className="p-2">{t('vehicle_issue_table.type')}</th>
              <th className="p-2">{t('vehicle_issue_table.description')}</th>
              <th className="p-2">{t('vehicle_issue_table.status')}</th>
              <th className="p-2">{t('vehicle_issue_table.assigned_to')}</th>
              <th className="p-2">{t('vehicle_issue_table.proposal')}</th>
              <th className="p-2">{t('vehicle_issue_table.actual')}</th>
              <th className="p-2">{t('vehicle_issue_table.approved')}</th>
              <th className="p-2">{t('vehicle_issue_table.closed_by')}</th>
              <th className="p-2">{t('vehicle_issue_table.comment')}</th>
              <th className="p-2">{t('vehicle_issue_table.reported')}</th>
              <th className="p-2 text-right">{t('vehicle_issue_table.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{issue.vin}</td>
                <td className="p-2">{issue.plateNumber}</td>
                <td className="p-2">{issue.stationName}</td>
                <td className="p-2">{issue.issueType}</td>
                <td className="p-2">{issue.description || '-'}</td>
                <td className="p-2">{renderStatusBadge(issue.status)}</td>
                <td className="p-2">{issue.assignedToName || '-'}</td>
                <td className="p-2">
                  {issue.proposedSolution ? (
                    <>
                      <div>{issue.proposedSolution}</div>
                      <div className="text-xs text-gray-500">{issue.proposedCost?.toLocaleString()} đ</div>
                    </>
                  ) : '-'}
                </td>
                <td className="p-2">
                  {issue.actualSolution ? (
                    <>
                      <div>{issue.actualSolution}</div>
                      <div className="text-xs text-gray-500">{issue.actualCost?.toLocaleString()} đ</div>
                    </>
                  ) : '-'}
                </td>
                <td className="p-2">{issue.approveStatus || '-'}</td>
                <td className="p-2">{issue.closedByName || '-'}</td>
                <td className="p-2">{issue.closeComment || '-'}</td>
                <td className="p-2">{issue.reportedAt?.toDate().toLocaleString()}</td>
                <td className="p-2">
                  <div className="flex flex-col items-end gap-1">
                    {isTechnician ? (
                      <>
                        {issue.status === 'assigned' && (
                          <Button size="sm" onClick={() => setProposingIssue?.(issue)}>
                            {t('vehicle_issue_table.submit_proposal')}
                          </Button>
                        )}
                        {issue.status === 'confirmed' && (
                          <Button size="sm" onClick={() => updateIssue(issue.id, { status: 'in_progress' })}>
                            {t('vehicle_issue_table.mark_in_progress')}
                          </Button>
                        )}
                        {issue.status === 'in_progress' && (
                          <Button size="sm" onClick={() => setUpdatingActualIssue?.(issue)}>
                            {t('vehicle_issue_table.submit_actual')}
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {(issue.status === 'pending' || issue.status === 'assigned') && (
                          <Button size="sm" variant="outline" onClick={() => { setEditingIssue(issue); setShowForm(true); }}>
                            {t('vehicle_issue_table.assign')}
                          </Button>
                        )}
                        {issue.status === 'proposed' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setViewingProposal(issue)}>
                              {t('vehicle_issue_table.view_proposal')}
                            </Button>
                            <Button size="sm" variant="success" onClick={() => setApprovingProposal(issue)}>
                              {t('vehicle_issue_table.approve_or_reject')}
                            </Button>
                          </>
                        )}
                        {issue.status === 'resolved' && (
                          <Button size="sm" variant="outline" onClick={() => { setClosingIssue(issue); setCloseDialogOpen(true); }}>
                            {t('vehicle_issue_table.close')}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ViewProposalDialog
        open={!!viewingProposal}
        issue={viewingProposal}
        onClose={() => setViewingProposalState(null)}
      />

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
