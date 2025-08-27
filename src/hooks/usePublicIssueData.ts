// 📁 assistant/report-public-issue/usePublicIssueForm.ts (optional hook)
// Xữ lý báo cáo của Techinician_assistant

import { useState } from 'react';
import { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';

export function usePublicIssueData(initial: Partial<PublicVehicleIssue> = {}) {
  const [form, setForm] = useState<Partial<PublicVehicleIssue>>(initial);

  const handleChange = (field: keyof PublicVehicleIssue, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return { form, setForm, handleChange };
}
