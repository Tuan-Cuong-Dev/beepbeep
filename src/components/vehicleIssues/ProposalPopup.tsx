"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { useState, useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (solution: string, cost: number) => void;
}

function formatCurrency(value: string) {
  const number = parseInt(value.replace(/\D/g, "")) || 0;
  return number.toLocaleString("vi-VN");
}

export default function ProposalPopup({ open, onClose, onSubmit }: Props) {
  const [solution, setSolution] = useState("");
  const [cost, setCost] = useState("");

  useEffect(() => {
    if (!open) {
      setSolution("");
      setCost("");
    }
  }, [open]);

  const handleSubmit = () => {
    const numericCost = parseInt(cost.replace(/\D/g, "")) || 0;
    onSubmit(solution, numericCost);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Proposal</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder="Proposed Solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
          />
          <Input
            placeholder="Proposed Cost (VNĐ)"
            inputMode="numeric"
            value={formatCurrency(cost)}
            onChange={(e) => setCost(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && solution && cost) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button disabled={!solution || !cost} onClick={handleSubmit}>
            Submit Proposal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
