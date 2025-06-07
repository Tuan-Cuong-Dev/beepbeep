'use client';

import { useUser } from "@/src/context/AuthContext";
import { useVehicleIssues } from "@/src/hooks/useVehicleIssues";
import { VehicleIssue } from "@/src/lib/vehicleIssues/vehicleIssueTypes";
import { useState } from "react";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";

export default function TechnicianIssuesPage() {
  const { user, companyId } = useUser();
  const { issues, updateIssue } = useVehicleIssues(companyId!, user?.uid || "", "technician");
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const unassignedIssues = issues.filter((i) => !i.assignedTo);
  const myIssues = issues.filter((i) => i.assignedTo === user?.uid);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold">🚧 My Vehicle Issues</h1>

      <div>
        <h2 className="text-lg font-semibold mb-4">Unassigned Issues</h2>
        {unassignedIssues.length === 0 && <p>No issues to assign.</p>}
        {unassignedIssues.map(issue => (
          <div key={issue.id} className="p-4 bg-white rounded-xl border space-y-2 mb-4">
            <p><strong>Ebike ID:</strong> {issue.ebikeId}</p>
            <p><strong>Issue:</strong> {issue.issueType}</p>
            <Button onClick={() => updateIssue(issue.id, { assignedTo: user?.uid, status: "in_progress" })}>
              Assign to Me
            </Button>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">My Assigned Issues</h2>
        {myIssues.length === 0 && <p>No assigned issues.</p>}
        {myIssues.map(issue => (
          <div key={issue.id} className="p-4 bg-white rounded-xl border space-y-2 mb-4">
            <p><strong>Ebike ID:</strong> {issue.ebikeId}</p>
            <p><strong>Status:</strong> {issue.status}</p>
            <Textarea
              placeholder="Resolution Note"
              value={resolutionNotes[issue.id] || ""}
              onChange={(e) => setResolutionNotes({ ...resolutionNotes, [issue.id]: e.target.value })}
            />
            <Button
              onClick={() => {
                updateIssue(issue.id, {
                  resolutionNote: resolutionNotes[issue.id] || "",
                  status: "resolved"
                });
              }}
            >
              Mark as Resolved
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
