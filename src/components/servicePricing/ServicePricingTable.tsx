'use client';

import { useState } from 'react';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import * as XLSX from 'xlsx';

interface Props {
  servicePricings: ServicePricing[];
  onEdit: (item: ServicePricing) => void;
  onDelete: (id: string) => void;
}

export default function ServicePricingTable({ servicePricings, onEdit, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const uniqueCategories = Array.from(
    new Set(servicePricings.map((s) => s.category).filter(Boolean))
  );

  const filtered = servicePricings.filter((item) => {
    const matchTitle = item.title.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter ? item.category === categoryFilter : true;
    const matchActive =
      activeFilter === 'all'
        ? true
        : activeFilter === 'active'
        ? item.isActive
        : !item.isActive;
    return matchTitle && matchCategory && matchActive;
  });

  const handleExport = () => {
    const exportData = filtered.map((item) => ({
      Title: item.title,
      Category: item.category,
      Duration: item.durationEstimate,
      Price: item.price,
      Active: item.isActive ? 'Yes' : 'No',
      Features: item.features.join(', '),
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Service Pricings');
    XLSX.writeFile(wb, 'service_pricings.xlsx');
  };

  return (
    <div className="space-y-4">
      {/* Bộ lọc + tìm kiếm */}
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Categories</option>
          {uniqueCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="border px-3 py-2 rounded"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>

        <Button variant="outline" onClick={handleExport}>
          Export to Excel
        </Button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2 text-left">Title</th>
              <th className="p-2 text-left">Category</th>
              <th className="p-2 text-left">Duration</th>
              <th className="p-2 text-left">Price</th>
              <th className="p-2 text-left">Active</th>
              <th className="p-2 text-left">Features</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">{item.title}</td>
                <td className="p-2">{item.category || '-'}</td>
                <td className="p-2">{item.durationEstimate || '-'}</td>
                <td className="p-2 text-right">
                  {item.price.toLocaleString('vi-VN')} VND
                </td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-2">{item.features?.join(', ') || '-'}</td>
                <td className="p-2 text-right space-x-2 whitespace-nowrap">
                  <Button variant="outline" size="sm" onClick={() => onEdit(item)}>
                    Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
