// 📁 assistant/report-public-issue/usePublicIssueForm.ts (optional hook)
// Xữ lý báo cáo của Techinician_assistant
import { useState } from 'react';
import { PublicIssue } from '@/src/lib/publicIssue/publicIssueTypes';

export function usePublicIssueData(initial: Partial<PublicIssue> = {}) {
  const [form, setForm] = useState<Partial<PublicIssue>>(initial);

  const handleChange = (field: keyof PublicIssue, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return { form, setForm, handleChange };
}
