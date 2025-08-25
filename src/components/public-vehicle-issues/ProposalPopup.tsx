'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Textarea } from "@/src/components/ui/textarea";
import { useState, useEffect } from "react";
import { parseCurrencyString } from "@/src/utils/parseCurrencyString";
import { formatCurrency } from "@/src/utils/formatCurrency";
import { useTranslation } from "react-i18next";
import { Lightbulb } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (solution: string, cost: number) => void;
}

export default function ProposalPopup({ open, onClose, onSubmit }: Props) {
  const { t } = useTranslation("common");
  const [solution, setSolution] = useState("");
  const [costRaw, setCostRaw] = useState("0");

  useEffect(() => {
    if (!open) {
      setSolution("");
      setCostRaw("0");
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
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            {t("proposal_popup.title", { defaultValue: "Đề xuất giải pháp" })}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {t("proposal_popup.subtitle", {
              defaultValue: "Vui lòng nhập giải pháp và chi phí đề xuất để gửi cho khách hàng.",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            placeholder={t("proposal_popup.solution_placeholder")}
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            className="min-h-[120px]"
            aria-label={t("proposal_popup.solution_label", { defaultValue: "Giải pháp đề xuất" })}
          />

          <Input
            placeholder={t("proposal_popup.cost_placeholder")}
            inputMode="numeric"
            value={formatCurrency(parseCurrencyString(costRaw))}
            onChange={(e) => setCostRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && solution && parseCurrencyString(costRaw) > 0) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            aria-label={t("proposal_popup.cost_label", { defaultValue: "Chi phí đề xuất" })}
          />
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onClose}>
            {t("common.cancel", { defaultValue: "Hủy" })}
          </Button>
          <Button
            disabled={!solution || parseCurrencyString(costRaw) <= 0}
            onClick={handleSubmit}
          >
            {t("proposal_popup.submit", { defaultValue: "Gửi đề xuất" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
