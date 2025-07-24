'use client';

import { useState } from 'react';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';

interface Props {
  onSearch: (term: string) => void;
  onClear?: () => void;
}

export default function BatteryChargingStationSearchBar({ onSearch, onClear }: Props) {
  const [term, setTerm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(term.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <Input
        placeholder="Search by name or address"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" variant="default">Search</Button>
      {onClear && (
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setTerm('');
            onClear();
          }}
        >
          Clear
        </Button>
      )}
    </form>
  );
}
