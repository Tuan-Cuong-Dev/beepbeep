'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/src/components/ui/dialog';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Textarea } from '@/src/components/ui/textarea';
import { useState, useEffect } from 'react';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (solution: string, cost: number) => void;
}

function formatCurrency(value: number): string {
  return value.toLocaleString('vi-VN');
}

export default function ProposalPopup({ open, onClose, onSubmit }: Props) {
  const { t } = useTranslation('common');
  const [solution, setSolution] = useState('');
  const [costRaw, setCostRaw] = useState('0');

  useEffect(() => {
    if (!open) {
      setSolution('');
      setCostRaw('0');
    }
  }, [open]);

  const handleSubmit = () => {
    const numericCost = parseCurrencyString(costRaw);
    onSubmit(solution, numericCost);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('proposal_popup.title')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder={t('proposal_popup.solution_placeholder')}
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
          />
          <Input
            placeholder={t('proposal_popup.cost_placeholder')}
            inputMode="numeric"
            value={formatCurrency(parseCurrencyString(costRaw))}
            onChange={(e) => setCostRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && solution && parseCurrencyString(costRaw) > 0) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>
            {t('proposal_popup.cancel')}
          </Button>
          <Button
            disabled={!solution || parseCurrencyString(costRaw) <= 0}
            onClick={handleSubmit}
          >
            {t('proposal_popup.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
