'use client';

import { useState } from 'react';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { Button } from '@/src/components/ui/button';
import { SimpleSelect } from '@/src/components/ui/select';
import { Input } from '@/src/components/ui/input';
import Pagination from '@/src/components/ui/pagination';
import * as XLSX from 'xlsx';

interface Props {
  partners: TechnicianPartner[];
  onEdit: (partner: TechnicianPartner) => void;
  onDelete?: (id: string) => void;
}

export default function TechnicianPartnerTable({ partners, onEdit, onDelete }: Props) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'mobile' | 'shop'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'assignedRegions'>('name');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredPartners = partners.filter((p) => {
    const matchesType = typeFilter === 'all' || p.type === typeFilter;
    const matchesSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.toLowerCase().includes(search.toLowerCase()) ||
      p.shopName?.toLowerCase().includes(search.toLowerCase()) ||
      p.shopAddress?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const sortedPartners = [...filteredPartners].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'rating') return (b.averageRating || 0) - (a.averageRating || 0);
    if (sortBy === 'assignedRegions') {
      const aRegion = (a.assignedRegions?.[0] || '').toLowerCase();
      const bRegion = (b.assignedRegions?.[0] || '').toLowerCase();
      return aRegion.localeCompare(bRegion, 'vi', { sensitivity: 'base' });
    }
    return 0;
  });


  const paginatedPartners = sortedPartners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(sortedPartners.length / itemsPerPage);

  const handleExportXLSX = () => {
    const data = sortedPartners.map((p) => ({
      Name: p.name,
      Phone: p.phone,
      Email: p.email,
      Type: p.type,
      ShopName: p.shopName || '',
      ShopAddress: p.shopAddress || '',
      MapAddress: p.mapAddress || '',
      Coordinates: p.coordinates ? `${p.coordinates.lat}, ${p.coordinates.lng}` : '',
      AssignedRegions: (p.assignedRegions || []).join(', '),
      WorkingDays: (p.workingHours || []).filter((d) => d.isWorking).map((d) => d.day).join(', '),
      Services: (p.serviceCategories || []).join(', '),
      Rating: p.averageRating || 'N/A',
      Active: p.isActive ? 'Yes' : 'No',
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Technicians');
    XLSX.writeFile(workbook, 'technician_partners.xlsx', { bookType: 'xlsx' });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
              { label: 'Assigned Regions', value: 'assignedRegions' },
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val as 'name' | 'rating' | 'assignedRegions')}
          />

          <Input
            placeholder="Search by name, email, phone, shop name, or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <Button className="w-full" variant="outline" onClick={handleExportXLSX}>
            Export EXCEL
          </Button>
        </div>
      </div>

      {/* Mobile View */}
      <div className="block md:hidden space-y-4">
        {paginatedPartners.map((partner) => (
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
            <div><strong>Coordinates:</strong> {partner.coordinates ? `${partner.coordinates.lat}, ${partner.coordinates.lng}` : '-'}</div>
            <div><strong>Assigned Regions:</strong> {(partner.assignedRegions || []).join(', ')}</div>
            <div><strong>Working Days:</strong> {(partner.workingHours || []).filter((d) => d.isWorking).map((d) => d.day.slice(0, 3)).join(', ')}</div>
            <div><strong>Service Categories:</strong> {(partner.serviceCategories || []).join(', ') || '-'}</div>
            <div><strong>Rating:</strong> {partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}</div>
            <div>
              <strong>Active:</strong>{' '}
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  partner.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {partner.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button size="sm" onClick={() => onEdit(partner)}>Edit</Button>
              {onDelete && partner.id && (
                <Button size="sm" variant="destructive" onClick={() => onDelete(partner.id!)}>Delete</Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View */}
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
              <th className="p-2 text-left">Coordinates</th>
              <th className="p-2 text-left">Assigned Regions</th>
              <th className="p-2 text-left">Working Days</th>
              <th className="p-2 text-left">Service Categories</th>
              <th className="p-2 text-left">Rating</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedPartners.map((partner) => (
              <tr key={partner.id} className="border-b">
                <td className="p-2 font-medium">{partner.name}</td>
                <td className="p-2">{partner.phone}</td>
                <td className="p-2">{partner.email || '-'}</td>
                <td className="p-2 capitalize">{partner.type}</td>
                <td className="p-2">{partner.shopName || '-'}</td>
                <td className="p-2">{partner.shopAddress || '-'}</td>
                <td className="p-2">{partner.coordinates ? `${partner.coordinates.lat}, ${partner.coordinates.lng}` : '-'}</td>
                <td className="p-2">{(partner.assignedRegions || []).join(', ')}</td>
                <td className="p-2">{(partner.workingHours || []).filter((d) => d.isWorking).map((d) => d.day.slice(0, 3)).join(', ')}</td>
                <td className="p-2">{(partner.serviceCategories || []).join(', ') || '-'}</td>
                <td className="p-2">{partner.averageRating ? `${partner.averageRating.toFixed(1)}★` : 'N/A'}</td>
                <td className="p-2">
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      partner.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {partner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>

                <td className="p-2">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" onClick={() => onEdit(partner)}>Edit</Button>
                    {onDelete && partner.id && (
                      <Button size="sm" variant="destructive" onClick={() => onDelete(partner.id!)}>Delete</Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
