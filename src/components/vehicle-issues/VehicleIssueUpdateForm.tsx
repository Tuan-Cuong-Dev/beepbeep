'use client';

import { useMemo, useState } from 'react';
import type { ExtendedVehicleIssue, VehicleIssueStatus } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { Button } from '@/src/components/ui/button';

interface Props {
  issue: ExtendedVehicleIssue;
  onSave: (updated: Partial<ExtendedVehicleIssue>) => void;
}

/** Có thể điều chỉnh theo vai trò / luồng thực tế nếu muốn hạn chế lựa chọn */
const ALL_STATUS: VehicleIssueStatus[] = [
  'pending',
  'assigned',
  'proposed',
  'confirmed',
  'in_progress',
  'resolved',
  'closed',
  'rejected',
];

export default function VehicleIssueUpdateForm({ issue, onSave }: Props) {
  const [status, setStatus] = useState<VehicleIssueStatus>(issue.status);

  // Notes/fields theo trạng thái
  const [actualSolution, setActualSolution] = useState<string>(issue.actualSolution ?? '');
  const [actualCost, setActualCost] = useState<string>(
    typeof issue.actualCost === 'number' ? String(issue.actualCost) : '',
  );
  const [closeComment, setCloseComment] = useState<string>(issue.closeComment ?? '');
  const [statusComment, setStatusComment] = useState<string>(issue.statusComment ?? '');

  const showActualFields = useMemo(() => status === 'resolved', [status]);
  const showCloseFields = useMemo(() => status === 'closed', [status]);
  const showRejectFields = useMemo(() => status === 'rejected', [status]);

  const handleSave = () => {
    const patch: Partial<ExtendedVehicleIssue> = { status };

    if (showActualFields) {
      patch.actualSolution = actualSolution.trim() || undefined;
      patch.actualCost = Number.isFinite(Number(actualCost)) ? Number(actualCost) : undefined;
    }

    if (showCloseFields) {
      patch.closeComment = closeComment.trim() || undefined;
    }

    if (showRejectFields) {
      patch.statusComment = statusComment.trim() || undefined;
    }

    onSave(patch);
  };

  return (
    <div className="space-y-4 p-4">
      <h3 className="font-bold text-lg">Update Issue</h3>

      {/* Status */}
      <div className="space-y-1">
        <label className="text-sm font-medium">Status</label>
        <select
          className="w-full rounded-md border px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as VehicleIssueStatus)}
        >
          {ALL_STATUS.map((opt) => (
            <option key={opt} value={opt}>
              {opt.replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Fields khi chọn Resolved */}
      {showActualFields && (
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Actual Solution</label>
            <Textarea
              rows={4}
              value={actualSolution}
              onChange={(e) => setActualSolution(e.target.value)}
              placeholder="What was actually done to resolve the issue?"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Actual Cost (VND)</label>
            <Input
              type="number"
              inputMode="numeric"
              value={actualCost}
              onChange={(e) => setActualCost(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
      )}

      {/* Fields khi chọn Closed */}
      {showCloseFields && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Close Comment</label>
          <Textarea
            rows={3}
            value={closeComment}
            onChange={(e) => setCloseComment(e.target.value)}
            placeholder="Reason/summary for closing the issue"
          />
        </div>
      )}

      {/* Fields khi chọn Rejected */}
      {showRejectFields && (
        <div className="space-y-1">
          <label className="text-sm font-medium">Reject Reason</label>
          <Textarea
            rows={3}
            value={statusComment}
            onChange={(e) => setStatusComment(e.target.value)}
            placeholder="Why is this proposal rejected?"
          />
        </div>
      )}

      <div className="pt-2">
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
}
