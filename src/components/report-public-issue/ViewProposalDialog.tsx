// 📁 components/report-public-issue/ViewProposalDialog.tsx
// OK rồi
'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { PublicIssue } from '@/src/lib/publicIssue/publicIssueTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  open: boolean;
  issue: PublicIssue | null;
  onClose: () => void;
}

export default function ViewProposalDialog({ open, issue, onClose }: Props) {
  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔍 Proposal Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p>
            <strong>Proposed by:</strong>{' '}
            {issue.assignedTo || 'Unknown'}
          </p>
          <p><strong>Proposal:</strong></p>
          <div className="border rounded p-2 bg-gray-50">
            {issue.proposedSolution || 'No proposal'}
          </div>
          <p>
            <strong>Estimated Cost:</strong>{' '}
            {issue.proposedCost?.toLocaleString('vi-VN') ?? 'N/A'} VND
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
