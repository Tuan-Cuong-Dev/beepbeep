'use client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  issue: PublicVehicleIssue | null;
  onClose: () => void;
}

export default function ViewProposalDialog({ open, issue, onClose }: Props) {
  const { t } = useTranslation('common');

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔍 {t('view_proposal.title', { defaultValue: 'Proposal Details' })}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p>
            <strong>{t('view_proposal.proposed_by', { defaultValue: 'Proposed by:' })}</strong>{' '}
            {issue.assignedToName || t('view_proposal.unknown', { defaultValue: 'Unknown' })}
          </p>
          <p>
            <strong>{t('view_proposal.proposal', { defaultValue: 'Proposal:' })}</strong>
          </p>
          <div className="border rounded p-2 bg-gray-50">
            {issue.proposedSolution || t('view_proposal.no_proposal', { defaultValue: 'No proposal' })}
          </div>
          <p>
            <strong>{t('view_proposal.estimated_cost', { defaultValue: 'Estimated Cost:' })}</strong>{' '}
            {issue.proposedCost?.toLocaleString('vi-VN') ?? t('view_proposal.na', { defaultValue: 'N/A' })} VND
          </p>
          <p className="text-xs text-gray-500 italic">
            {t('view_proposal.estimated_note', {
              defaultValue: 'Chi phí chỉ là ước tính, sẽ xác nhận lại sau khi đến kiểm tra.',
            })}
          </p>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onClose}>
            {t('view_proposal.close', { defaultValue: 'Close' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
