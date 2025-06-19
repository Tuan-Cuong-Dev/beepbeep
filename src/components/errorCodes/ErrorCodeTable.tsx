'use client';

import { useState } from 'react';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';
import { useUser } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Pencil, Trash, ExternalLink } from 'lucide-react';

interface Props {
  errorCodes: ErrorCode[];
  onEdit: (item: ErrorCode) => void;
  onDelete: (item: ErrorCode) => void;
}

export default function ErrorCodeTable({ errorCodes, onEdit, onDelete }: Props) {
  const { role } = useUser();
  const isTechnician = role === 'technician';

  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const uniqueBrands = Array.from(new Set(errorCodes.map(e => e.brand).filter(Boolean)));
  const uniqueModels = Array.from(new Set(errorCodes.map(e => e.modelName).filter(Boolean)));

  const filtered = errorCodes.filter((e) => {
    const matchBrand = brandFilter ? e.brand === brandFilter : true;
    const matchModel = modelFilter ? e.modelName === modelFilter : true;
    const matchSearch = searchTerm
      ? (e.code + e.description + e.recommendedSolution)
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      : true;

    return matchBrand && matchModel && matchSearch;
  });

  return (
    <div className="space-y-4">
      {/* Bộ lọc và tìm kiếm */}
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

        <Input
          className="border p-2 rounded-md w-full sm:w-64"
          placeholder="Search by code, description or solution"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Hiển thị bảng desktop */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Code</th>
              <th className="p-2 text-left">Description</th>
              <th className="p-2 text-left">Solution</th>
              <th className="p-2 text-left">Brand</th>
              <th className="p-2 text-left">Model</th>
              <th className="p-2 text-left">Video</th>
              <th className="p-2 text-left">Suggestions</th>
              <th className="p-2 text-left">Created At</th>
              {!isTechnician && <th className="p-2 text-left">Actions</th>}
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
                <td className="p-2">
                  {item.tutorialVideoUrl ? (
                    <a
                      href={item.tutorialVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 underline inline-flex items-center gap-1"
                    >
                      YouTube <ExternalLink className="w-4 h-4 inline" />
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">No link</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {item.technicianSuggestions?.length ?? 0}
                </td>
                <td className="p-2">{item.createdAt?.toDate().toLocaleString()}</td>
                {!isTechnician && (
                  <td className="p-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hiển thị mobile dạng thẻ */}
      <div className="sm:hidden space-y-4">
        {filtered.map((item) => (
          <div key={item.id} className="border rounded-xl p-4 shadow bg-white">
            <div className="text-blue-600 font-semibold text-base mb-2">{item.code}</div>
            <div className="text-sm text-gray-800 mb-1">
              <strong>Description:</strong> {item.description}
            </div>
            <div className="text-sm text-gray-700 mb-1">
              <strong>Solution:</strong> {item.recommendedSolution}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Brand:</strong> {item.brand || '-'}
            </div>
            <div className="text-sm text-gray-600">
              <strong>Model:</strong> {item.modelName || '-'}
            </div>
            {item.tutorialVideoUrl && (
              <div className="text-sm text-blue-500 mt-1">
                <a
                  href={item.tutorialVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline inline-flex items-center gap-1"
                >
                  Watch Video <ExternalLink className="w-4 h-4 inline" />
                </a>
              </div>
            )}
            <div className="text-sm text-gray-500">
              <strong>Suggestions:</strong> {item.technicianSuggestions?.length ?? 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {item.createdAt?.toDate().toLocaleString()}
            </div>
            {!isTechnician && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => onEdit(item)} className="w-full">
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(item)} className="w-full">
                  Delete
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
