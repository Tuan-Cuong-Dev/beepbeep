// 📁 components/report-public-issue/PublicIssueList.tsx
// OK rồi

'use client';

import { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  issues: PublicVehicleIssue[];
  technicianMap: Record<string, string>;
  onEdit?: (issue: PublicVehicleIssue) => void;
  onUpdateStatus?: (issue: PublicVehicleIssue, newStatus: PublicIssueStatus) => void;
  isTechnician?: boolean;
}

export default function PublicIssueList({
  issues,
  technicianMap,
  onEdit,
  onUpdateStatus,
  isTechnician = false,
}: Props) {
  if (!issues.length) return <div className="p-4 text-center text-gray-400">No issues found.</div>;

  const sortedIssues = [...issues].sort((a, b) => {
    const aTime = a.createdAt?.toDate().getTime() ?? 0;
    const bTime = b.createdAt?.toDate().getTime() ?? 0;
    return bTime - aTime;
  });

  const getStatusStyle = (status: PublicIssueStatus) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-500';
      case 'assigned': return 'bg-blue-100 text-blue-700';
      case 'proposed': return 'bg-yellow-100 text-yellow-700';
      case 'confirmed': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'in_progress': return 'bg-indigo-100 text-indigo-700';
      case 'resolved': return 'bg-green-200 text-green-800';
      case 'closed': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="overflow-auto border rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Name</th>
            <th className="p-2">Phone</th>
            <th className="p-2">License Plate</th>
            <th className="p-2">Vehicle</th>
            <th className="p-2">Description</th>
            <th className="p-2">Status</th>
            <th className="p-2">Location</th>
            <th className="p-2">Created At</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedIssues.map((issue) => {
            const assignedName = issue.assignedTo
              ? technicianMap[issue.assignedTo] ?? issue.assignedTo
              : 'Unassigned';

            return (
              <tr key={issue.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{issue.customerName}</td>
                <td className="p-2">{issue.phone}</td>
                <td className="p-2">{issue.vehicleLicensePlate || '-'}</td>
                <td className="p-2">{issue.vehicleBrand} {issue.vehicleModel}</td>
                <td className="p-2 text-gray-600">{issue.issueDescription}</td>
                <td className="p-2 capitalize">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusStyle(issue.status)}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-2">{issue.location?.mapAddress || '-'}</td>
                <td className="p-2">{issue.createdAt?.toDate().toLocaleString() || '-'}</td>
                <td className="p-2 space-x-2">
                  {isTechnician ? (
                    <>
                      {issue.status === 'assigned' && (
                        <Button onClick={() => onUpdateStatus?.(issue, 'in_progress')}>
                          Start Progress
                        </Button>
                      )}
                      {issue.status === 'in_progress' && (
                        <Button variant="secondary" onClick={() => onUpdateStatus?.(issue, 'resolved')}>
                          Mark Resolved
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button onClick={() => onEdit?.(issue)}>
                      Update
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}