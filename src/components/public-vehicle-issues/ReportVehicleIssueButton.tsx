// src/components/public-issues/ReportVehicleIssueButton.tsx
// Nút để người dùng báo lỗi "Hỏng Xe"
'use client';

import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import ReportVehicleIssueModal from './ReportVehicleIssueModal';

export default function ReportVehicleIssueButton() {
  const { t } = useTranslation('common');
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        title={t('report_vehicle_issue_button.label')}
        aria-label={t('report_vehicle_issue_button.label')}
        className="
          inline-flex items-center gap-2 px-4 h-9 rounded-full
          font-medium
          text-yellow-700 border border-yellow-300
          bg-yellow-50
          hover:bg-yellow-50 hover:border-yellow-400 hover:text-yellow-800
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-300/70
          active:bg-yellow-100 active:translate-y-px
          transition-colors transition-transform
          disabled:opacity-60
        "
      >
        <AlertTriangle className="w-4 h-4" aria-hidden />
        <span className="ml-2">{t('report_vehicle_issue_button.label')}</span>
      </Button>

      {open && (
        <ReportVehicleIssueModal open={open} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
