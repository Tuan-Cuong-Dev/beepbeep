"use client";

import { ExtendedVehicleIssue, VehicleIssueStatus } from "@/src/lib/vehicleIssues/vehicleIssueTypes";
import { Button } from "@/src/components/ui/button";

interface Props {
  issues: ExtendedVehicleIssue[];
  technicianMap: Record<string, string>;
  onEdit?: (issue: ExtendedVehicleIssue) => void;
  onUpdateStatus?: (issue: ExtendedVehicleIssue, newStatus: VehicleIssueStatus) => void;
  isTechnician?: boolean;
}

export default function VehicleIssueList({
  issues,
  technicianMap,
  onEdit,
  onUpdateStatus,
  isTechnician = false,
}: Props) {
  if (!issues.length) return <div className="p-4 text-center text-gray-400">No issues found.</div>;

  const sortedIssues = [...issues].sort((a, b) => {
    const aTime = a.reportedAt?.toDate().getTime() ?? 0;
    const bTime = b.reportedAt?.toDate().getTime() ?? 0;
    return bTime - aTime;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "pending": return "bg-gray-100 text-gray-500";
      case "assigned": return "bg-blue-100 text-blue-700";
      case "in_progress": return "bg-yellow-100 text-yellow-700";
      case "resolved": return "bg-green-100 text-green-700";
      case "closed": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-500";
    }
  };

  return (
    <div className="overflow-auto border rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">VIN</th>
            <th className="p-2">Plate</th>
            <th className="p-2">Issue Type</th>
            <th className="p-2">Description</th>
            <th className="p-2">Status</th>
            <th className="p-2">Company</th>
            <th className="p-2">Station</th>
            <th className="p-2">Reported By</th>
            <th className="p-2">Reported At</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedIssues.map(issue => {
            const assignedName = issue.assignedTo
              ? technicianMap[issue.assignedTo] ?? issue.assignedToName
              : "Unassigned";

            return (
              <tr key={issue.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{issue.vin}</td>
                <td className="p-2">{issue.plateNumber}</td>
                <td className="p-2">{issue.issueType}</td>
                <td className="p-2 text-gray-600">{issue.description || "-"}</td>
                <td className="p-2 capitalize">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs ${getStatusStyle(issue.status)}`}>
                    {issue.status?.replace("_", " ") || "Pending"}
                  </span>
                </td>
                <td className="p-2">{issue.companyName || "-"}</td>
                <td className="p-2">{issue.stationName || "-"}</td>
                <td className="p-2">{issue.reportedBy || "-"}</td>
                <td className="p-2">{issue.reportedAt?.toDate().toLocaleString() || "-"}</td>
                <td className="p-2 space-x-2">
                  {isTechnician ? (
                    <>
                      {issue.status === "assigned" && (
                        <Button onClick={() => onUpdateStatus?.(issue, "in_progress")}>
                          Start Progress
                        </Button>
                      )}
                      {issue.status === "in_progress" && (
                        <Button variant="secondary" onClick={() => onUpdateStatus?.(issue, "resolved")}>
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
