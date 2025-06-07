'use client';

import { Program } from '@/src/lib/programs/programsType';
import { Button } from '@/src/components/ui/button';
import { format } from 'date-fns';

interface Props {
  programs: Program[];
  onEdit: (program: Program) => void;
  onToggleActive: (programId: string, isActive: boolean) => void;
}

export default function ProgramsTable({ programs, onEdit, onToggleActive }: Props) {
  if (!programs.length) {
    return <div className="text-center text-gray-400 p-8">No programs found.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto mt-6">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-2">Title</th>
            <th className="p-2">Type</th>
            <th className="p-2">Created By</th>
            <th className="p-2">Start</th>
            <th className="p-2">End</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => (
            <tr key={p.id} className="border-t">
              <td className="p-2">{p.title}</td>
              <td className="p-2 capitalize">{p.type.replace('_', ' ')}</td>
              <td className="p-2 capitalize">{p.createdByRole}</td>
              <td className="p-2">{p.startDate ? format(p.startDate.toDate(), 'yyyy-MM-dd') : '-'}</td>
              <td className="p-2">{p.endDate ? format(p.endDate.toDate(), 'yyyy-MM-dd') : '-'}</td>
              <td className="p-2">
                {p.isActive ? (
                  <span className="text-[#00d289]">Active</span>
                ) : (
                  <span className="text-gray-400">Inactive</span>
                )}
              </td>
              <td className="p-2 space-x-2">
                <Button variant="outline" onClick={() => onEdit(p)}>Edit</Button>
                <Button
                  
                  variant={p.isActive ? 'destructive' : 'default'}
                  onClick={() => onToggleActive(p.id, !p.isActive)}
                >
                  {p.isActive ? 'Disable' : 'Enable'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
