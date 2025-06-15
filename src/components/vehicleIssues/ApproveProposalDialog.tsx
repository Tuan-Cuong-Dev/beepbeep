// 📄 components/vehicleIssues/ApproveProposalDialog.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { ExtendedVehicleIssue } from '@/src/lib/vehicleIssues/vehicleIssueTypes';

interface Props {
  open: boolean;
  issue: ExtendedVehicleIssue | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export default function ApproveProposalDialog({ open, issue, onClose, onApprove, onReject }: Props) {
  const [rejectReason, setRejectReason] = useState('');

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>📝 Approve or Reject Proposal</DialogTitle>
        </DialogHeader>

        <div className="text-sm space-y-2">
          <p><strong>Proposal:</strong> {issue.proposedSolution}</p>
          <p><strong>Estimated Cost:</strong> {issue.proposedCost?.toLocaleString()} VND</p>
        </div>

        <textarea
          rows={3}
          className="w-full border p-2 text-sm mt-4"
          placeholder="Reason for rejection (optional)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />

        <DialogFooter className="mt-4 space-x-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => onReject(rejectReason)}>Reject</Button>
          <Button className="bg-green-600 text-white" onClick={onApprove}>Approve</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
