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
    <div className="space-y-4">
      {/* Mobile view */}
      <div className="block md:hidden space-y-4">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="border rounded-lg p-4 shadow-sm space-y-2 text-sm"
          >
            <div><strong>Name:</strong> {partner.name}</div>
            <div><strong>Phone:</strong> {partner.phone}</div>
            <div><strong>Email:</strong> {partner.email || '-'}</div>
            <div><strong>Type:</strong> {partner.type}</div>
            {partner.type === 'shop' && (
              <>
                <div><strong>Shop Name:</strong> {partner.shopName || '-'}</div>
                <div><strong>Shop Address:</strong> {partner.shopAddress || '-'}</div>
              </>
            )}
            <div>
              <strong>Assigned Regions:</strong>{' '}
              {(partner.assignedRegions || []).join(', ')}
            </div>
            <div>
              <strong>Working Days:</strong>{' '}
              {(partner.workingHours || [])
                .filter((d) => d.isWorking)
                .map((d) => d.day.slice(0, 3))
                .join(', ')}
            </div>
            <div>
              <strong>Service Categories:</strong>{' '}
              {(partner.serviceCategories || []).join(', ') || '-'}
            </div>
            <div>
              <strong>Rating:</strong>{' '}
              {partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button size="sm" onClick={() => onEdit(partner)}>Edit</Button>
              {onDelete && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(partner.id)}
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop view */}
      <div className="hidden md:block overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Type</th>
              <th className="p-2 text-left">Shop Name</th>
              <th className="p-2 text-left">Shop Address</th>
              <th className="p-2 text-left">Assigned Regions</th>
              <th className="p-2 text-left">Working Days</th>
              <th className="p-2 text-left">Service Categories</th>
              <th className="p-2 text-left">Rating</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {partners.map((partner) => (
              <tr key={partner.id} className="border-b">
                <td className="p-2 font-medium">{partner.name}</td>
                <td className="p-2">{partner.phone}</td>
                <td className="p-2">{partner.email || '-'}</td>
                <td className="p-2 capitalize">{partner.type}</td>
                <td className="p-2">{partner.shopName || '-'}</td>
                <td className="p-2">{partner.shopAddress || '-'}</td>
                <td className="p-2">{(partner.assignedRegions || []).join(', ')}</td>
                <td className="p-2">
                  {(partner.workingHours || [])
                    .filter((d) => d.isWorking)
                    .map((d) => d.day.slice(0, 3))
                    .join(', ')}
                </td>
                <td className="p-2">{(partner.serviceCategories || []).join(', ') || '-'}</td>
                <td className="p-2">
                  {partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" onClick={() => onEdit(partner)}>Edit</Button>
                    {onDelete && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onDelete(partner.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
