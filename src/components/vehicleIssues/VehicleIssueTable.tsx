'use client';

import { ExtendedVehicleIssue } from "@/src/lib/vehicleIssues/vehicleIssueTypes";
import { Button } from "@/src/components/ui/button";
import { formatCurrency } from "@/src/utils/formatCurrency";
import { useMemo } from "react";

interface Props {
  issues: ExtendedVehicleIssue[];
  technicianMap: Record<string, string>;
  onEdit: (issue: ExtendedVehicleIssue) => void;
  updateIssue: (id: string, data: Partial<ExtendedVehicleIssue>) => void;
  setClosingIssue: (issue: ExtendedVehicleIssue | null) => void;
  setCloseDialogOpen: (open: boolean) => void;
  setEditingIssue: (issue: ExtendedVehicleIssue | null) => void;
  setShowForm: (v: boolean) => void;
  normalizedRole?: string;
  isAdmin?: boolean;
  searchTerm?: string;
  statusFilter?: string;
  stationFilter?: string;
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending": return "text-gray-500";
    case "assigned": return "text-blue-600";
    case "proposed": return "text-yellow-600";
    case "confirmed": return "text-green-600";
    case "rejected": return "text-red-600";
    case "in_progress": return "text-indigo-600";
    case "resolved": return "text-purple-600";
    case "closed": return "text-black";
    default: return "text-gray-500";
  }
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
  searchTerm = '',
  statusFilter = 'All',
  stationFilter = '',
}: Props) {
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        issue.vin?.toLowerCase().includes(term) ||
        issue.plateNumber?.toLowerCase().includes(term) ||
        issue.issueType?.toLowerCase().includes(term) ||
        issue.description?.toLowerCase().includes(term) ||
        issue.status?.toLowerCase().includes(term);

      const matchesStatus = statusFilter === 'All' ? true : issue.status === statusFilter;
      const matchesStation = stationFilter === '' ? true : issue.stationId === stationFilter;

      return matchesSearch && matchesStatus && matchesStation;
    }).sort((a, b) => {
      const aTime = a.reportedAt?.toDate().getTime() ?? 0;
      const bTime = b.reportedAt?.toDate().getTime() ?? 0;
      return bTime - aTime;
    });
  }, [issues, searchTerm, statusFilter, stationFilter]);

  if (!filteredIssues.length) return <div className="p-4 text-center text-gray-400">No issues found.</div>;

  return (
    <div className="overflow-auto border rounded-xl">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">VIN</th>
            <th className="p-2">Plate</th>
            <th className="p-2">Issue Type</th>
            <th className="p-2 w-[500px]">Description</th>
            <th className="p-2">Status</th>
            <th className="p-2">Company</th>
            <th className="p-2">Station</th>
            <th className="p-2">Assigned To</th>
            <th className="p-2">Reported By</th>
            <th className="p-2">Reported At</th>
            <th className="p-2 w-[600px]">Proposed Solution</th>
            <th className="p-2">Proposed Cost</th>
            <th className="p-2 w-[600px]">Actual Solution</th>
            <th className="p-2">Actual Cost</th>
            <th className="p-2">Closed By</th>
            <th className="p-2">Closed At</th>
            <th className="p-2">Close Comment</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {filteredIssues.map((issue) => {
            const disableAssign = [
              "proposed", "confirmed", "rejected",
              "in_progress", "resolved", "closed",
            ].includes(issue.status);

            return (
              <tr key={issue.id} className="border-t hover:bg-gray-50">
                <td className="p-2">{issue.vin || "-"}</td>
                <td className="p-2">{issue.plateNumber || "-"}</td>
                <td className="p-2">{issue.issueType || "-"}</td>
                <td className="p-2 w-[300px] break-words whitespace-pre-wrap text-gray-600">{issue.description || "-"}</td>
                <td className={`p-2 font-semibold ${getStatusColor(issue.status)}`}>{issue.status}</td>
                <td className="p-2">{issue.companyName || "-"}</td>
                <td className="p-2">{issue.stationName || "-"}</td>
                <td className="p-2">{issue.assignedToName || "Unassigned"}</td>
                <td className="p-2">{issue.reportedBy || "-"}</td>
                <td className="p-2">{issue.reportedAt?.toDate().toLocaleString() || "-"}</td>
                <td className="p-2 w-[600px] break-words whitespace-pre-wrap">{issue.proposedSolution || "-"}</td>
                <td className="p-2">{issue.proposedCost ? formatCurrency(issue.proposedCost) : "-"}</td>
                <td className="p-2 w-[600px] break-words whitespace-pre-wrap">{issue.actualSolution || "-"}</td>
                <td className="p-2">{issue.actualCost ? formatCurrency(issue.actualCost) : "-"}</td>
                <td className="p-2">{issue.closedByName || issue.closedBy || "-"}</td>
                <td className="p-2">{issue.closedAt?.toDate().toLocaleString() || "-"}</td>
                <td className="p-2 text-gray-500 text-xs italic">{issue.closeComment || "-"}</td>
                <td className="p-2 space-y-1">
                  {issue.status === "proposed" && (normalizedRole === "company_owner" || normalizedRole === "company_admin" || isAdmin) && (
                    <>
                      <Button className="bg-green-500 text-white hover:bg-green-600" onClick={() => updateIssue(issue.id, { status: "confirmed" })}>Approve</Button>
                      <Button variant="outline" className="mt-2 text-red-600 border-red-400 hover:bg-red-50" onClick={() => updateIssue(issue.id, { status: "rejected" })}>Reject</Button>
                    </>
                  )}
                  {issue.status === "resolved" && (normalizedRole === "company_owner" || isAdmin) && (
                    <Button variant="outline" className="text-gray-600 border-gray-400" onClick={() => { setClosingIssue(issue); setCloseDialogOpen(true); }}>Close Issue</Button>
                  )}
                  {issue.status !== "proposed" && (
                    <Button variant="ghost" disabled={disableAssign} onClick={() => { setEditingIssue(issue); setShowForm(true); }}>Assign</Button>
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
