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
import { ExtendedVehicleIssue } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  issue: ExtendedVehicleIssue | null;
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
          <DialogTitle>{t('approve_proposal_dialog.title')}</DialogTitle>
        </DialogHeader>

        <div className="text-sm space-y-2">
          <p>
            <strong>{t('approve_proposal_dialog.proposal')}:</strong>{' '}
            {issue.proposedSolution || '—'}
          </p>
          <p>
            <strong>{t('approve_proposal_dialog.estimated_cost')}:</strong>{' '}
            {issue.proposedCost != null ? formatCurrency(issue.proposedCost) : '—'} VND
          </p>
        </div>

        <div className="mt-4">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {t('approve_proposal_dialog.rejection_reason_label')}
          </label>
          <Textarea
            rows={3}
            placeholder={t('approve_proposal_dialog.rejection_reason_placeholder')}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </div>

        <DialogFooter className="mt-4 space-x-2">
          <Button variant="outline" onClick={onClose}>
            {t('approve_proposal_dialog.cancel')}
          </Button>
          <Button variant="destructive" onClick={() => onReject(rejectReason.trim())}>
            {t('approve_proposal_dialog.reject')}
          </Button>
          <Button
            className="bg-green-600 text-white hover:bg-green-700"
            onClick={onApprove}
            disabled={!issue.proposedSolution}
          >
            {t('approve_proposal_dialog.approve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
