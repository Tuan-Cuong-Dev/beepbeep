'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';
import { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck } from 'lucide-react';

interface Props {
  open: boolean;
  issue: PublicVehicleIssue | null;
  onClose: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export default function ApproveProposalDialog({
  open,
  issue,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const { t } = useTranslation('common');
  const [rejectReason, setRejectReason] = useState('');

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
            {t('approve_proposal.title', { defaultValue: 'Approve or Reject Proposal' })}
          </DialogTitle>
        </DialogHeader>

        <div className="text-sm space-y-2">
          <p>
            <strong>{t('approve_proposal.proposal', { defaultValue: 'Proposal:' })}</strong>{' '}
            {issue.proposedSolution || '—'}
          </p>
          <p>
            <strong>{t('approve_proposal.estimated_cost', { defaultValue: 'Estimated Cost:' })}</strong>{' '}
            {issue.proposedCost != null ? formatCurrency(issue.proposedCost) : '—'}
          </p>
          <p className="text-xs text-gray-500 italic">
            {t('approve_proposal.estimated_note', {
              defaultValue:
                'The cost is only an estimate and will be confirmed after on-site inspection.',
            })}
          </p>
        </div>

        <div className="mt-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t('approve_proposal.reject_reason_label')}
          </label>
          <Textarea
            rows={3}
            placeholder={t('approve_proposal.reject_reason_placeholder')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <DialogFooter className="mt-4 space-x-2">
          <Button variant="outline" onClick={onClose}>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onReject(rejectReason.trim())}
          >
            {t('approve_proposal.reject', { defaultValue: 'Reject' })}
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={onApprove}
            disabled={!issue.proposedSolution}
          >
            {t('approve_proposal.approve', { defaultValue: 'Approve' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
