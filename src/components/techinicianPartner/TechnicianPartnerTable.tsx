'use client';

import { useState } from 'react';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import * as XLSX from 'xlsx';

interface Props {
  partners: TechnicianPartner[];
  onEdit: (partner: TechnicianPartner) => void;
  onDelete?: (id: string) => void;
}

export default function TechnicianPartnerTable({ partners, onEdit, onDelete }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'mobile' | 'shop'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating'>('name');

  const filteredPartners = partners.filter((p) =>
    typeFilter === 'all' ? true : p.type === typeFilter
  );

  const sortedPartners = [...filteredPartners].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    return 0;
  });

  const handleExportCSV = () => {
    const data = sortedPartners.map((p) => ({
      Name: p.name,
      Phone: p.phone,
      Email: p.email,
      Type: p.type,
      ShopName: p.shopName || '',
      ShopAddress: p.shopAddress || '',
      AssignedRegions: (p.assignedRegions || []).join(', '),
      WorkingDays: (p.workingHours || []).filter((d) => d.isWorking).map((d) => d.day).join(', '),
      Services: (p.serviceCategories || []).join(', '),
      Rating: p.averageRating || 'N/A',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Technicians');
    XLSX.writeFile(workbook, 'technician_partners.csv');
  };

  return (
    <div className="space-y-6">
      {/* Header + Filter */}
      <div className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <SimpleSelect
            placeholder="Filter by type"
            options={[
              { label: 'All', value: 'all' },
              { label: 'Shop-based', value: 'shop' },
              { label: 'Mobile', value: 'mobile' },
            ]}
            value={typeFilter}
            onChange={(val: string) => setTypeFilter(val as 'all' | 'mobile' | 'shop')}
          />

          <SimpleSelect
            placeholder="Sort by"
            options={[
              { label: 'Name', value: 'name' },
              { label: 'Rating', value: 'rating' },
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val as 'name' | 'rating')}
          />

          <Button className="w-full" variant="outline" onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Mobile view */}
      <div className="block md:hidden space-y-4">
        {sortedPartners.map((partner) => (
          <div key={partner.id} className="border rounded-lg p-4 shadow-sm space-y-2 text-sm">
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
            <div><strong>Assigned Regions:</strong> {(partner.assignedRegions || []).join(', ')}</div>
            <div><strong>Working Days:</strong> {(partner.workingHours || []).filter((d) => d.isWorking).map((d) => d.day.slice(0, 3)).join(', ')}</div>
            <div><strong>Service Categories:</strong> {(partner.serviceCategories || []).join(', ') || '-'}</div>
            <div><strong>Rating:</strong> {partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}</div>
            <div className="flex gap-2 justify-end pt-2">
              <Button size="sm" onClick={() => onEdit(partner)}>Edit</Button>
              {onDelete && partner.id && (
                <Button size="sm" variant="destructive" onClick={() => onDelete(partner.id!)}>
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
            {sortedPartners.map((partner) => (
              <tr key={partner.id} className="border-b">
                <td className="p-2 font-medium">{partner.name}</td>
                <td className="p-2">{partner.phone}</td>
                <td className="p-2">{partner.email || '-'}</td>
                <td className="p-2 capitalize">{partner.type}</td>
                <td className="p-2">{partner.shopName || '-'}</td>
                <td className="p-2">{partner.shopAddress || '-'}</td>
                <td className="p-2">{(partner.assignedRegions || []).join(', ')}</td>
                <td className="p-2">{(partner.workingHours || []).filter((d) => d.isWorking).map((d) => d.day.slice(0, 3)).join(', ')}</td>
                <td className="p-2">{(partner.serviceCategories || []).join(', ') || '-'}</td>
                <td className="p-2">
                  {partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}
                </td>
                <td className="p-2">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" onClick={() => onEdit(partner)}>Edit</Button>
                    {onDelete && partner.id && (
                      <Button size="sm" variant="destructive" onClick={() => onDelete(partner.id!)}>
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
