// Rental Companies và Private Provider tạo Các chương trình khuyến mãi
// 08/09/2025

'use client';

import { Program } from '@/src/lib/programs/rental-programs/programsType';
import { Button } from '@/src/components/ui/button';
import { format } from 'date-fns';
import { Badge } from '@/src/components/ui/badge';

interface Props {
  programs: Program[];
  onEdit: (program: Program) => void;
  onToggleActive: (programId: string, isActive: boolean) => void;
  onDelete?: (programId: string) => void;
  onViewParticipants?: (programId: string) => void;
}

export default function ProgramsTable({
  programs,
  onEdit,
  onToggleActive,
  onDelete,
  onViewParticipants,
}: Props) {
  if (!programs.length) {
    return (
      <div className="text-center text-gray-400 p-8">
        No programs found.
      </div>
    );
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
          {programs.map((p) => {
            const start = p.startDate?.toDate?.() ?? null;
            const end = p.endDate?.toDate?.() ?? null;
            const isExpired = end && end < new Date();

            return (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-medium">{p.title}</td>
                <td className="p-2 capitalize">
                  {p.type.replace(/_/g, ' ')}
                </td>
                <td className="p-2 capitalize">{p.createdByRole}</td>
                <td className="p-2">
                  {start ? format(start, 'yyyy-MM-dd') : '-'}
                </td>
                <td className={`p-2 ${isExpired ? 'text-red-500' : ''}`}>
                  {end ? format(end, 'yyyy-MM-dd') : '-'}
                </td>
                <td className="p-2">
                  {p.isActive ? (
                    <Badge className="bg-[#00d289] text-white">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                </td>
                <td className="p-2 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(p)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant={p.isActive ? 'destructive' : 'default'}
                    size="sm"
                    onClick={() => onToggleActive(p.id, !p.isActive)}
                  >
                    {p.isActive ? 'Disable' : 'Enable'}
                  </Button>
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(p.id)}
                    >
                      Delete
                    </Button>
                  )}
                  {onViewParticipants && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewParticipants(p.id)}
                    >
                      Participants
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
