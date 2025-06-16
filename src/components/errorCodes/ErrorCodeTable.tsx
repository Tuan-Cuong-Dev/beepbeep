'use client';

import { useState } from 'react';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';
import { Button } from '@/src/components/ui/button';
import { Pencil, Trash } from 'lucide-react';

interface Props {
  errorCodes: ErrorCode[];
  onEdit: (item: ErrorCode) => void;
  onDelete: (item: ErrorCode) => void;
}

export default function ErrorCodeTable({ errorCodes, onEdit, onDelete }: Props) {
  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');

  const uniqueBrands = Array.from(new Set(errorCodes.map(e => e.brand).filter(Boolean)));
  const uniqueModels = Array.from(new Set(errorCodes.map(e => e.modelName).filter(Boolean)));

  const filtered = errorCodes.filter((e) => {
    const matchBrand = brandFilter ? e.brand === brandFilter : true;
    const matchModel = modelFilter ? e.modelName === modelFilter : true;
    return matchBrand && matchModel;
  });

  return (
    <div className="space-y-4">
      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4">
        <select
          className="border p-2 rounded-md"
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
        >
          <option value="">All Brands</option>
          {uniqueBrands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded-md"
          value={modelFilter}
          onChange={(e) => setModelFilter(e.target.value)}
        >
          <option value="">All Models</option>
          {uniqueModels.map((model) => (
            <option key={model} value={model}>{model}</option>
          ))}
        </select>
      </div>

      {/* Bảng mã lỗi */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Solution</th>
              <th className="p-2 text-left">Brand</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-left">Created At</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2 font-semibold text-blue-600">{item.code}</td>
                <td className="p-2">{item.description}</td>
                <td className="p-2">{item.recommendedSolution}</td>
                <td className="p-2">{item.brand || '-'}</td>
                <td className="p-2">{item.modelName || '-'}</td>
                <td className="p-2">{item.createdAt?.toDate().toLocaleString()}</td>
                <td className="p-2 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
                    <Trash className="w-4 h-4" />
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