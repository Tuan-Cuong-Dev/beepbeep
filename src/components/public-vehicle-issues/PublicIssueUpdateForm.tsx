// 📁 components/report-public-issue/VehicleIssueUpdateForm.tsx
// OK rồi

'use client';

import { useState } from 'react';
import { PublicVehicleIssue, PublicIssueStatus } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';
import { Label } from '@/src/components/ui/label';

interface Props {
  issue: PublicVehicleIssue;
  onSave: (updated: Partial<PublicVehicleIssue>) => void;
}

const statusOptions: PublicIssueStatus[] = [
  'pending',
  'assigned',
  'proposed',
  'confirmed',
  'rejected',
  'in_progress',
  'resolved',
  'closed',
];

export default function VehicleIssueUpdateForm({ issue, onSave }: Props) {
  const [status, setStatus] = useState<PublicIssueStatus>(issue.status);
  const [closeComment, setCloseComment] = useState(issue.closeComment || '');

  const handleSave = () => {
    onSave({
      status,
      closeComment,
    });
  };

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow-md max-w-xl mx-auto">
      <h3 className="text-lg font-bold text-gray-800">Update Issue Status</h3>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as PublicIssueStatus)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          {statusOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="note">Resolution Note</Label>
        <Textarea
          id="note"
          placeholder="Optional notes for closing or resolving the issue"
          value={closeComment}
          onChange={(e) => setCloseComment(e.target.value)}
        />
      </div>

      <Button onClick={handleSave}>Save</Button>
    </div>
  );
}