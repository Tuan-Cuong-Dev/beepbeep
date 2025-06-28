'use client';

import { useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';

interface Props {
  onSubmit: (suggestion: string) => void;
  disabled?: boolean;
  loading?: boolean;
}

export default function TechnicianSuggestionForm({ onSubmit, disabled = false, loading = false }: Props) {
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (!comment.trim()) return;
    onSubmit(comment.trim());
    setComment('');
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Enter your suggestion to improve the solution..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={disabled || loading}
      />
      <Button onClick={handleSubmit} disabled={disabled || loading || !comment.trim()}>
        {loading ? 'Submitting...' : 'Submit Suggestion'}
      </Button>
    </div>
  );
}
