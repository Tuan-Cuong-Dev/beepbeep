'use client';

import { PublicIssue, PublicIssueStatus } from '@/src/lib/publicIssue/publicIssueTypes';
import { Button } from '@/src/components/ui/button';
import { format } from 'date-fns';

interface Props {
  issues: PublicIssue[];
  onEdit: (issue: PublicIssue) => void;
  updateIssue: (id: string, data: Partial<PublicIssue>) => Promise<void>;
  setClosingIssue: (issue: PublicIssue | null) => void;
  setCloseDialogOpen: (open: boolean) => void;
  setEditingIssue: (issue: PublicIssue | null) => void;
  setShowForm: (open: boolean) => void;
  normalizedRole: string;
  isAdmin: boolean;
  isTechnician?: boolean;
  setProposingIssue?: (issue: PublicIssue | null) => void;
  setUpdatingActualIssue?: (issue: PublicIssue | null) => void;
  setViewingProposal: (issue: PublicIssue | null) => void;
  setApprovingProposal: (issue: PublicIssue | null) => void;
}

export default function PublicIssueTable({
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
  const renderStatusBadge = (status: PublicIssueStatus) => {
    const colorMap: Record<PublicIssueStatus, string> = {
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
      <span className={`px-2 py-1 text-white text-xs rounded ${colorMap[status]}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  const renderActions = (issue: PublicIssue) => {
    if (isTechnician) {
      return (
        <>
          {issue.status === 'assigned' && (
            <Button size="sm" onClick={() => setProposingIssue?.(issue)}>
              Submit Proposal
            </Button>
          )}
          {issue.status === 'confirmed' && (
            <Button size="sm" onClick={() => updateIssue(issue.id!, { status: 'in_progress' })}>
              Mark In Progress
            </Button>
          )}
          {issue.status === 'in_progress' && (
            <Button size="sm" onClick={() => setUpdatingActualIssue?.(issue)}>
              Submit Actual
            </Button>
          )}
        </>
      );
    } else {
      return (
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
      );
    }
  };

  return (
    <div className="overflow-x-auto border rounded-xl">
      <div className="hidden lg:block">
        <table className="min-w-[1200px] text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Customer</th>
              <th className="p-2">Phone</th>
              <th className="p-2">Plate</th>
              <th className="p-2">Brand</th>
              <th className="p-2">Model</th>
              <th className="p-2">Description</th>
              <th className="p-2">Coordinates</th>
              <th className="p-2 align-top w-64 text-gray-700">Issue Address</th>
              <th className="p-2">Status</th>
              <th className="p-2">Assigned</th>
              <th className="p-2">Proposal</th>
              <th className="p-2">Proposed Cost</th>
              <th className="p-2">Approve Status</th>
              <th className="p-2">Actual</th>
              <th className="p-2">Actual Cost</th>
              <th className="p-2">Reported</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Closed By</th>
              <th className="p-2">Closed At</th>
              <th className="p-2">Close Comment</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => (
              <tr key={issue.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{issue.customerName}</td>
                <td className="p-2">{issue.phone}</td>
                <td className="p-2">{issue.vehicleLicensePlate || '-'}</td>
                <td className="p-2">{issue.vehicleBrand || '-'}</td>
                <td className="p-2">{issue.vehicleModel || '-'}</td>
                <td className="p-2">{issue.issueDescription}</td>
                <td className="p-2">{issue.location?.coordinates || '-'}</td>
                <td className="p-2 align-top w-64 text-gray-700">
                  <div className="line-clamp-2 break-words leading-snug">
                    {issue.location?.issueAddress || '-'}
                  </div>
                </td>
                <td className="p-2">{renderStatusBadge(issue.status)}</td>
                <td className="p-2">{issue.assignedTo || '-'}</td>
                <td className="p-2">{issue.proposedSolution || '-'}</td>
                <td className="p-2">{issue.proposedCost !== undefined ? issue.proposedCost : '-'}</td>
                <td className="p-2">{issue.approveStatus || '-'}</td>
                <td className="p-2">{issue.actualSolution || '-'}</td>
                <td className="p-2">{issue.actualCost !== undefined ? issue.actualCost : '-'}</td>
                <td className="p-2">{issue.createdAt?.toDate ? format(issue.createdAt.toDate(), 'Pp') : '-'}</td>
                <td className="p-2">{issue.updatedAt?.toDate ? format(issue.updatedAt.toDate(), 'Pp') : '-'}</td>
                <td className="p-2">{issue.closedByName || '-'}</td>
                <td className="p-2">{issue.closedAt?.toDate ? format(issue.closedAt.toDate(), 'Pp') : '-'}</td>
                <td className="p-2">{issue.closeComment || '-'}</td>
                <td className="p-2 space-x-1 whitespace-nowrap">{renderActions(issue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden p-2 space-y-4">
        {issues.map((issue) => (
          <div key={issue.id} className="border rounded-lg p-3 bg-white shadow-sm">
            <div className="font-semibold text-sm mb-1">{issue.customerName} - {issue.phone}</div>
            <div className="text-xs text-gray-600 mb-1">{issue.vehicleBrand} / {issue.vehicleModel} - {issue.vehicleLicensePlate}</div>
            <div className="text-sm mb-1"><strong>Description:</strong> {issue.issueDescription}</div>
            <div className="text-sm mb-1"><strong>Coordinates:</strong> {issue.location?.coordinates || '-'}</div>
            <div className="text-sm mb-1"><strong>Address:</strong> <div className="line-clamp-2 leading-snug break-words">{issue.location?.issueAddress || '-'}</div></div>
            <div className="text-sm mb-1"><strong>Status:</strong> {renderStatusBadge(issue.status)}</div>
            <div className="text-sm mb-1"><strong>Proposal:</strong> {issue.proposedSolution || '-'}</div>
            <div className="text-sm mb-1"><strong>Actual:</strong> {issue.actualSolution || '-'}</div>
            <div className="text-sm mb-1"><strong>Reported:</strong> {issue.createdAt?.toDate ? format(issue.createdAt.toDate(), 'Pp') : '-'}</div>
            <div className="flex flex-wrap gap-2 mt-2">{renderActions(issue)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
