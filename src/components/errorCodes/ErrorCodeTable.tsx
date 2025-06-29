'use client';

import { useState } from 'react';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';
import { useUser } from '@/src/context/AuthContext';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Pencil, Trash, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import TechnicianSuggestionList from './TechnicianSuggestionList';

interface Props {
  errorCodes: ErrorCode[];
  onEdit: (item: ErrorCode) => void;
  onDelete: (item: ErrorCode) => void;
}

export default function ErrorCodeTable({ errorCodes, onEdit, onDelete }: Props) {
  const { role } = useUser();
  const isTechnician = role === 'technician';
  const isTechnicianPartner = role === 'technician_partner';

  const [brandFilter, setBrandFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForSuggestion, setSelectedForSuggestion] = useState<ErrorCode | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const renderReferences = (refs: { name?: string; phone?: string }[]) => {
    if (!refs || refs.length === 0) return '—';
    return refs
      .map((r) => `${r.name || 'N/A'} – ${r.phone || 'N/A'}`)
      .join(', ');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <select
          className="border p-2 rounded-md"
          value={brandFilter}
          onChange={(e) => {
            setBrandFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Brands</option>
          {uniqueBrands.map((brand) => (
            <option key={brand} value={brand}>{brand}</option>
          ))}
        </select>

        <select
          className="border p-2 rounded-md"
          value={modelFilter}
          onChange={(e) => {
            setModelFilter(e.target.value);
            setCurrentPage(1);
          }}
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

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
              <th className="p-2 text-left">Reference</th>
              <th className="p-2 text-left">Created At</th>
              {!(isTechnician || isTechnicianPartner) && <th className="p-2 text-left">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2 font-semibold text-[#00d289]">{item.code}</td>
                <td className="p-2">{item.description}</td>
                <td className="p-2">{item.recommendedSolution}</td>
                <td className="p-2">{item.brand || '-'}</td>
                <td className="p-2">{item.modelName || '-'}</td>
                <td className="p-2">
                  {item.tutorialVideoUrl ? (
                    <a href={item.tutorialVideoUrl} target="_blank" rel="noopener noreferrer" className="text-[#00d289] underline inline-flex items-center gap-1">
                      YouTube <ExternalLink className="w-4 h-4 inline" />
                    </a>
                  ) : <span className="text-gray-400 italic">No link</span>}
                </td>
                <td className="p-2 text-center">
                  {(item.technicianSuggestions?.length ?? 0) > 0 ? (
                    <button onClick={() => setSelectedForSuggestion(item)} className="text-[#00d289] underline hover:text-[#00d289]">
                      {item.technicianSuggestions?.length}
                    </button>
                  ) : <span className="text-gray-500">0</span>}
                </td>

                <td className="p-2 text-sm">{renderReferences(item.technicianReferences || [])}</td>
                <td className="p-2">{item.createdAt?.toDate().toLocaleString()}</td>
                {!(isTechnician || isTechnicianPartner) && (
                  <td className="p-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(item)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(item)}><Trash className="w-4 h-4" /></Button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center items-center gap-6 mt-6 text-gray-700 text-sm">
        <button className={`px-4 py-1 rounded border ${currentPage === 1 ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100 border-gray-300'}`} onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
          Previous
        </button>
        <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
        <button className={`px-4 py-1 rounded border ${currentPage === totalPages ? 'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-100 border-gray-300'}`} onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>

      {selectedForSuggestion && (
        <Dialog open={!!selectedForSuggestion} onOpenChange={() => setSelectedForSuggestion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                💬 Suggestions for <span className="text-[#00d289]">{selectedForSuggestion.code}</span>
              </DialogTitle>
            </DialogHeader>
            <TechnicianSuggestionList suggestions={selectedForSuggestion.technicianSuggestions || []} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
