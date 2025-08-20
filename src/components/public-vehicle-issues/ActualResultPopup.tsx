// 📁 components/report-public-issue/ActualResultPopup.tsx
// OK rồi

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

/**
 * Parse chuỗi tiền (ví dụ '1.250.000 ₫') thành số nguyên 1250000
 */
function parseCurrencyString(value: string): number {
  if (!value) return 0;
  const numericString = value.replace(/[^\d]/g, '');
  const number = parseInt(numericString, 10);
  return isNaN(number) ? 0 : number;
}

/**
 * Format số thành chuỗi tiền tệ
 */
function formatCurrency(value: string): string {
  const number = parseCurrencyString(value);
  return number.toLocaleString('vi-VN');
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (solution: string, cost: number) => void;
}

export default function ActualResultPopup({ open, onClose, onSubmit }: Props) {
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
          <DialogTitle>Submit Actual Result</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Actual Solution</label>
            <Textarea
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Describe what was actually done to fix the issue..."
              rows={4}
            />
          </div>

          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Actual Cost (VND)</label>
            <Input
              type="text"
              inputMode="numeric"
              value={formatCurrency(cost)}
              onChange={(e) => setCost(e.target.value)}
              placeholder="e.g. 500.000 ₫"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[#00d289] text-white hover:bg-[#00b67a]"
            disabled={!solution || !cost}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
