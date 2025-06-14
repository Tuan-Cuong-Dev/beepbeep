'use client';

import { ExtendedVehicleIssue, VehicleIssueStatus } from '@/src/lib/vehicleIssues/vehicleIssueTypes';
import { Button } from '@/src/components/ui/button';

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

  // 👉 Thêm các hàm này để xử lý popup
  setProposingIssue?: (issue: ExtendedVehicleIssue | null) => void;
  setUpdatingActualIssue?: (issue: ExtendedVehicleIssue | null) => void;

  searchTerm: string;
  statusFilter: string;
  stationFilter: string;
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
    <table className="min-w-full text-sm">
      <thead className="bg-gray-100 text-left">
        <tr>
          <th className="p-2">VIN</th>
          <th className="p-2">Plate</th>
          <th className="p-2">Type</th>
          <th className="p-2">Description</th>
          <th className="p-2">Status</th>
          <th className="p-2">Reported</th>
          <th className="p-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {issues.map((issue) => (
          <tr key={issue.id} className="border-t hover:bg-gray-50">
            <td className="p-2">{issue.vin}</td>
            <td className="p-2">{issue.plateNumber}</td>
            <td className="p-2">{issue.issueType}</td>
            <td className="p-2">{issue.description}</td>
            <td className="p-2">{renderStatusBadge(issue.status)}</td>
            <td className="p-2">{issue.reportedAt?.toDate().toLocaleString()}</td>
            <td className="p-2 space-y-1 text-right">
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
                  {issue.status === 'proposed' && (
                    <span className="text-green-600 italic">Waiting Approval</span>
                  )}
                  {issue.status === 'rejected' && (
                    <span className="text-gray-400 italic">No actions</span>
                  )}
                </>
              ) : (
                <>
                  {isAdmin && (
                    <Button size="sm" variant="outline" onClick={() => { setEditingIssue(issue); setShowForm(true); }}>
                      Assign
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { setClosingIssue(issue); setCloseDialogOpen(true); }}>
                    Close
                  </Button>
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
