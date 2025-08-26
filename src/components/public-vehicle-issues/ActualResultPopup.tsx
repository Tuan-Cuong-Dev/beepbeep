'use client';

import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
  const [costRaw, setCostRaw] = useState('');      // giữ nguyên người dùng gõ
  const [focused, setFocused] = useState(false);   // để biết khi nào nên format

  useEffect(() => {
    if (!open) {
      setSolution('');
      setCostRaw('');
      setFocused(false);
    }
  }, [open]);

  // Hàm chỉ cho phép số và dấu phân tách cơ bản
  const normalizeDigits = (s: string) => s.replace(/[^\d.,]/g, '');

  const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCostRaw(normalizeDigits(e.target.value));
  };

  const handleCostBlur = () => {
    setFocused(false);
    // format nhẹ nhàng khi blur (nếu có số)
    const n = parseCurrencyString(costRaw);
    if (Number.isFinite(n) && n > 0) {
      setCostRaw(formatCurrency(n));
    }
  };

  const handleCostFocus = () => {
    setFocused(true);
    // bỏ format khi focus để gõ mượt
    const n = parseCurrencyString(costRaw);
    if (n > 0) setCostRaw(String(n));
  };

  const handleSubmit = () => {
    const costNumber = parseCurrencyString(costRaw);
    onSubmit(solution.trim(), costNumber);
    setSolution('');
    setCostRaw('');
    setFocused(false);
  };

  const costIsEmpty = costRaw.trim() === '' || parseCurrencyString(costRaw) <= 0;

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
              value={
                focused
                  ? costRaw // khi focus: hiển thị raw để gõ mượt
                  : (costRaw ? costRaw : '')
              }
              onChange={handleCostChange}
              onFocus={handleCostFocus}
              onBlur={handleCostBlur}
              placeholder={t('actual_result.cost_placeholder', {
                defaultValue: 'e.g. 500000',
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
            disabled={!solution.trim() || costIsEmpty}
            onClick={handleSubmit}
          >
            {t('actual_result.submit', { defaultValue: 'Submit' })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
