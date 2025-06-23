'use client';

import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  partners: TechnicianPartner[];
  onEdit: (partner: TechnicianPartner) => void;
  onDelete?: (id: string) => void;
}

export default function TechnicianPartnerTable({ partners, onEdit, onDelete }: Props) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Phone</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Assigned Regions</th>
            <th className="p-2 text-left">Working Days</th>
            <th className="p-2 text-left">Rating</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {partners.map((partner) => (
            <tr key={partner.id} className="border-b">
              <td className="p-2 font-medium">{partner.name}</td>
              <td className="p-2">{partner.phone}</td>
              <td className="p-2 capitalize">{partner.type}</td>
              <td className="p-2">
                {(partner.assignedRegions || []).slice(0, 2).join(', ')}
                {partner.assignedRegions && partner.assignedRegions.length > 2 && '...'}
              </td>
              <td className="p-2">
                {(partner.workingHours || [])
                  .filter((d) => d.isWorking)
                  .map((d) => d.day.substring(0, 3))
                  .join(', ')}
              </td>
              <td className="p-2">
                {partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}
              </td>
              <td className="p-2 text-right">
                <Button size="sm" onClick={() => onEdit(partner)} className="mr-2">
                  Edit
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(partner.id)}
                  >
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
