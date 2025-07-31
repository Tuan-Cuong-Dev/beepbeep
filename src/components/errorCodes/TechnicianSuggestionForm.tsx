'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';

interface Props {
  onSubmit: (suggestion: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function TechnicianSuggestionForm({ onSubmit, disabled = false, loading = false }: Props) {
  const { t } = useTranslation('common');
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!comment.trim()) return;
    onSubmit(comment.trim());
    setComment('');
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder={t('technician_suggestion_form.placeholder')}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={disabled || loading}
      />
      <Button onClick={handleSubmit} disabled={disabled || loading || !comment.trim()}>
        {loading ? t('technician_suggestion_form.submitting') : t('technician_suggestion_form.submit')}
      </Button>
    </div>
  );
}
