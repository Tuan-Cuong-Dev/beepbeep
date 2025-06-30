// 📁 assistant/report-public-issue/usePublicIssueForm.ts (optional hook)
import { useState } from 'react';
import { PublicIssue } from '@/src/lib/publicIssue/publicIssueTypes';

export function usePublicIssueForm(initial: Partial<PublicIssue> = {}) {
  const [form, setForm] = useState<Partial<PublicIssue>>(initial);

  const handleChange = (field: keyof PublicIssue, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  return { form, setForm, handleChange };
}