import { useState } from "react";
import { VehicleIssue, VehicleIssueStatus } from "@/src/lib/vehicleIssues/vehicleIssueTypes";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { Button } from "@/src/components/ui/button";

interface Props {
  issue: VehicleIssue;
  onSave: (updated: Partial<VehicleIssue>) => void;
}

const statusOptions: VehicleIssueStatus[] = ["pending", "in_progress", "resolved", "closed"];

export default function VehicleIssueUpdateForm({ issue, onSave }: Props) {
  const [status, setStatus] = useState<VehicleIssueStatus>(issue.status);
  const [resolutionNote, setResolutionNote] = useState(issue.resolutionNote || "");

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-bold">Update Issue</h3>

      <label>Status:</label>
      <select value={status} onChange={(e) => setStatus(e.target.value as VehicleIssueStatus)}>
        {statusOptions.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>

      <label>Resolution Note:</label>
      <Textarea value={resolutionNote} onChange={(e) => setResolutionNote(e.target.value)} />

      <Button onClick={() => onSave({ status, resolutionNote })}>Save</Button>
    </div>
  );
}
