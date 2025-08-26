'use client';

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import { ExtendedVehicleIssue } from '@/src/lib/vehicle-issues/vehicleIssueTypes';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  issue: ExtendedVehicleIssue | null;
  onClose: () => void;
}

export default function ViewProposalDialog({ open, issue, onClose }: Props) {
  const { t } = useTranslation("common", { keyPrefix: "view_proposal_dialog" });

  if (!issue) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>🔍 {t("title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <p><strong>{t("proposed_by")}:</strong> {issue.assignedToName || t("unknown")}</p>
          <p><strong>{t("proposal")}:</strong></p>
          <div className="border rounded p-2 bg-gray-50">
            {issue.proposedSolution || t("no_proposal")}
          </div>
          <p><strong>{t("estimated_cost")}:</strong> {issue.proposedCost?.toLocaleString()} VND</p>
        </div>

        <DialogFooter className="mt-4">
          <Button onClick={onClose}>{t("close")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
