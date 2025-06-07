// components/booking/ProgramSelector.tsx

'use client';

import { useEffect, useState } from 'react';
import { Program } from '@/src/lib/programs/programsType';
import { getProgramsByRole } from '@/src/lib/programs/programsService';
import { useUser } from '@/src/context/AuthContext';

interface ProgramSelectorProps {
  companyId: string;
  selectedProgramId: string | null;
  onChange: (programId: string | null) => void;
}

export default function ProgramSelector({ companyId, selectedProgramId, onChange }: ProgramSelectorProps) {
  const { role } = useUser();
  const [programs, setPrograms] = useState<Program[]>([]);

  useEffect(() => {
    const fetchPrograms = async () => {
      const data = await getProgramsByRole(role || '', companyId);
      const rentalPrograms = data.filter(p => p.type === 'rental_program' && p.isActive !== false);
      setPrograms(rentalPrograms);
    };

    fetchPrograms();
  }, [role, companyId]);

  if (programs.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="font-medium">Program (optional)</label>
      <select
        value={selectedProgramId || ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full border rounded p-2"
      >
        <option value="">-- No Program --</option>
        {programs.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
    </div>
  );
}
