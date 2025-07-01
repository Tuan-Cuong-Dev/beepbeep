'use client';

import { useState } from 'react';
import { ExtendedVehicleIssue, VehicleIssueStatus } from '@/src/lib/vehicleIssues/vehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import ViewProposalDialog from '@/src/components/vehicleIssues/ViewProposalDialog';
import ApproveProposalDialog from '@/src/components/vehicleIssues/ApproveProposalDialog';

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
  refetchIssues: () => Promise<void>; // 👈 thêm dòng này
   // 👇 THÊM DÒNG NÀY
  setViewingProposal: (issue: ExtendedVehicleIssue | null) => void;
  setApprovingProposal: (issue: ExtendedVehicleIssue | null) => void;
}

export default function VehicleIssueTable({
  issues,
  technicianMap,
  onEdit,
  updateIssue,
  setClosingIssue,
  setCloseDialogOpen,
  setEditingIssue,
  setShowForm,
  normalizedRole,
  isAdmin,
  isTechnician,
  setProposingIssue,
  setUpdatingActualIssue,
}: Props) {
  const [viewingProposal, setViewingProposal] = useState<ExtendedVehicleIssue | null>(null);
  const [approvingProposal, setApprovingProposal] = useState<ExtendedVehicleIssue | null>(null);

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
      {/* Mobile View */}
      <div className="grid gap-4 sm:hidden">
        {issues.map((issue) => (
          <div key={issue.id} className="border rounded-lg p-4 bg-white shadow space-y-2">
            <div className="font-semibold text-base text-blue-600">{issue.vin}</div>
            <div className="text-sm text-gray-600">Plate: {issue.plateNumber}</div>
            <div className="text-sm text-gray-600">Station: {issue.stationName}</div>
            <div className="text-sm text-gray-600">Type: {issue.issueType}</div>
            <td className="text-sm text-gray-600 text-blue-600 ">Descriptions: {issue.description || '-'}</td>
            <div className="text-sm text-gray-600">Status: {renderStatusBadge(issue.status)}</div>
            <div className="text-sm text-gray-600">Assigned To: {issue.assignedToName || '-'}</div>
            <div className="text-sm text-gray-600">Proposal: {issue.proposedSolution || '-'}</div>
            <div className="text-sm text-gray-600">Actual: {issue.actualSolution || '-'}</div>
            <div className="text-sm text-gray-600">Reported: {issue.reportedAt?.toDate().toLocaleString()}</div>
            <div className="flex flex-wrap gap-2 pt-2">
              {isTechnician ? (
                <>
                  {issue.status === 'assigned' && (
                    <Button size="sm" onClick={() => setProposingIssue?.(issue)}>
                      Submit Proposal
                    </Button>
                  )}
                  {issue.status === 'confirmed' && (
                    <Button size="sm" onClick={() => updateIssue(issue.id, { status: 'in_progress' })}>
                      Mark In Progress
                    </Button>
                  )}
                  {issue.status === 'in_progress' && (
                    <Button size="sm" onClick={() => setUpdatingActualIssue?.(issue)}>
                      Submit Actual
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {(issue.status === 'pending' || issue.status === 'assigned') && (
                    <Button size="sm" variant="outline" onClick={() => { setEditingIssue(issue); setShowForm(true); }}>
                      Assign
                    </Button>
                  )}
                  {issue.status === 'proposed' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => setViewingProposal(issue)}>
                        View Proposal
                      </Button>
                      <Button size="sm" variant="success" onClick={() => setApprovingProposal(issue)}>
                        Approve / Reject
                      </Button>
                    </>
                  )}
                  {issue.status === 'resolved' && (
                    <Button size="sm" variant="outline" onClick={() => { setClosingIssue(issue); setCloseDialogOpen(true); }}>
                      Close
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">VIN</th>
              <th className="p-2">Plate</th>
              <th className="p-2">Station</th>
              <th className="p-2">Type</th>
              <th className="p-2">Descriptions</th>
              <th className="p-2">Status</th>
              <th className="p-2">Assigned To</th>
              <th className="p-2">Proposal</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Approved</th>
              <th className="p-2">Closed By</th>
              <th className="p-2">Comment</th>
              <th className="p-2">Reported</th>
              <th className="p-2 text-right">Actions</th>
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
                            Submit Proposal
                          </Button>
                        )}
                        {issue.status === 'confirmed' && (
                          <Button size="sm" onClick={() => updateIssue(issue.id, { status: 'in_progress' })}>
                            Mark In Progress
                          </Button>
                        )}
                        {issue.status === 'in_progress' && (
                          <Button size="sm" onClick={() => setUpdatingActualIssue?.(issue)}>
                            Submit Actual
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        {(issue.status === 'pending' || issue.status === 'assigned') && (
                          <Button size="sm" variant="outline" onClick={() => { setEditingIssue(issue); setShowForm(true); }}>
                            Assign
                          </Button>
                        )}
                        {issue.status === 'proposed' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => setViewingProposal(issue)}>
                              View Proposal
                            </Button>
                            <Button size="sm" variant="success" onClick={() => setApprovingProposal(issue)}>
                              Approve / Reject
                            </Button>
                          </>
                        )}
                        {issue.status === 'resolved' && (
                          <Button size="sm" variant="outline" onClick={() => { setClosingIssue(issue); setCloseDialogOpen(true); }}>
                            Close
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

      {/* View Proposal Dialog */}
      <ViewProposalDialog
        open={!!viewingProposal}
        issue={viewingProposal}
        onClose={() => setViewingProposal(null)}
      />

      {/* Approve / Reject Dialog */}
      <ApproveProposalDialog
        open={!!approvingProposal}
        issue={approvingProposal}
        onClose={() => setApprovingProposal(null)}
        onApprove={async () => {
          if (approvingProposal) {
            await updateIssue(approvingProposal.id, { status: 'confirmed' });
            setApprovingProposal(null);
          }
        }}
        onReject={async (reason) => {
          if (approvingProposal) {
            await updateIssue(approvingProposal.id, {
              status: 'rejected',
              closeComment: reason,
            });
            setApprovingProposal(null);
          }
        }}
      />
    </>
  );
}
