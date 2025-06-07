'use client';

import { useState } from 'react';
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

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (solution: string, cost: number) => void;
}

export default function ActualResultPopup({ open, onClose, onSubmit }: Props) {
  const [solution, setSolution] = useState('');
  const [cost, setCost] = useState('');

  const handleSubmit = () => {
    const costNumber = parseInt(cost.replace(/\D/g, ''), 10) || 0;
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
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="e.g. 500000"
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-[#00d289] text-white hover:bg-[#00b67a]" onClick={handleSubmit}>
            Submit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
