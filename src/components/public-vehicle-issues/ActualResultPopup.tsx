'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/src/components/ui/dialog';
import { Textarea } from '@/src/components/ui/textarea';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';
import { parseCurrencyString } from '@/src/utils/parseCurrencyString';
import { formatCurrency } from '@/src/utils/formatCurrency';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (solution: string, cost: number) => void;
}

export default function ActualResultPopup({ open, onClose, onSubmit }: Props) {
  const { t } = useTranslation('common');
  const [solution, setSolution] = useState('');
  const [cost, setCost] = useState('');

  useEffect(() => {
    if (!open) {
      setSolution('');
      setCost('');
    }
  }, [open]);

  const handleSubmit = () => {
    const costNumber = parseCurrencyString(cost);
    onSubmit(solution.trim(), costNumber);
    setSolution('');
    setCost('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t('actual_result.title', { defaultValue: 'Submit Actual Result' })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {t('actual_result.solution_label', { defaultValue: 'Actual Solution' })}
            </label>
            <Textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder={t('actual_result.solution_placeholder', {
                defaultValue: 'Describe what was actually done to fix the issue...',
              })}
              rows={4}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">
              {t('actual_result.cost_label', { defaultValue: 'Actual Cost (VND)' })}
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={cost ? formatCurrency(cost) : ''}
              onChange={(e) => setCost(e.target.value)}
              placeholder={t('actual_result.cost_placeholder', {
                defaultValue: 'e.g. 500.000 ₫',
              })}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            {t('actual_result.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            className="bg-[#00d289] text-white hover:bg-[#00b67a]"
            disabled={!solution || !cost}
            onClick={handleSubmit}
          >
            {t('actual_result.submit', { defaultValue: 'Submit' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
