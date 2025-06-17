'use client';

import { useState } from 'react';
import { TechnicianSuggestion } from '@/src/lib/errorCodes/errorCodeTypes';
import { Button } from '@/src/components/ui/button';
import { Textarea } from '@/src/components/ui/textarea';

interface Props {
  onSubmit: (suggestion: string) => void;
  disabled?: boolean;
}

export default function TechnicianSuggestionForm({ onSubmit, disabled }: Props) {
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
        disabled={disabled}
      />
      <Button onClick={handleSubmit} disabled={disabled || !comment.trim()}>
        Submit Suggestion
      </Button>
    </div>
  );
}
