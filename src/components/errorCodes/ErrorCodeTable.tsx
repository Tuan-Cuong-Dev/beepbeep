'use client';

import { useState } from 'react';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Pencil, Trash, ExternalLink } from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import TechnicianSuggestionList from './TechnicianSuggestionList';
import { useTranslation } from 'react-i18next';

interface Props {
  errorCodes: ErrorCode[];
  onEdit: (item: ErrorCode) => void;
  onDelete: (item: ErrorCode) => void;
}

const ITEMS_PER_PAGE = 10;

export default function ErrorCodeTable({ errorCodes, onEdit, onDelete }: Props) {
  const { role } = useUser();
  const isTechnician = role === 'technician';
  const isTechnicianPartner = role === 'technician_partner';
  const { t } = useTranslation('common', { keyPrefix: 'error_code_table' });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForSuggestion, setSelectedForSuggestion] = useState<ErrorCode | null>(null);
  const [page, setPage] = useState(1);

  const filtered = errorCodes.filter((e) => {
    const matchSearch = searchTerm
      ? (e.code + e.description + e.recommendedSolution).toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    return matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedItems = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const renderReferences = (refs: { name?: string; phone?: string }[]) => {
    if (!refs?.length) return '—';
    return refs.map((r) => `${r.name || 'N/A'} – ${r.phone || 'N/A'}`).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Input
          placeholder={t('search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {/* 📱 Mobile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {paginatedItems.map((item) => (
          <div key={item.id} className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#00d289]">{item.code}</h3>
              {!isTechnician && !isTechnicianPartner && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-800">{item.description}</p>
            <p className="text-sm text-gray-700 italic">💡 {item.recommendedSolution}</p>

            <div className="text-xs text-gray-500 space-y-1">
              <p>📦 Brand: {item.brand || '-'}</p>
              <p>🚗 Model: {item.modelName || '-'}</p>
              <p>
                🎥 Video:{' '}
                {item.tutorialVideoUrl ? (
                  <a
                    href={item.tutorialVideoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#00d289] underline inline-flex items-center gap-1"
                  >
                    YouTube <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="italic text-gray-400">{t('no_link')}</span>
                )}
              </p>
              <p>
                🛠 Suggestions:{' '}
                {(item.technicianSuggestions?.length ?? 0) > 0 ? (
                  <button
                    onClick={() => setSelectedForSuggestion(item)}
                    className="text-[#00d289] underline"
                  >
                    {item.technicianSuggestions?.length ?? 0}
                  </button>
                ) : (
                  <span className="text-gray-400">0</span>
                )}
              </p>
              <p>📞 References: {renderReferences(item.technicianReferences || [])}</p>
              <p>🕒 Created: {item.createdAt?.toDate().toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 🖥️ Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">{t('code')}</th>
              <th className="p-2 text-left">{t('description')}</th>
              <th className="p-2 text-left">{t('solution')}</th>
              <th className="p-2 text-left">{t('brand')}</th>
              <th className="p-2 text-left">{t('model')}</th>
              <th className="p-2 text-left">{t('video')}</th>
              <th className="p-2 text-left">{t('suggestions')}</th>
              <th className="p-2 text-left">{t('reference')}</th>
              <th className="p-2 text-left">{t('created_at')}</th>
              {!isTechnician && !isTechnicianPartner && <th className="p-2 text-left">{t('actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="p-2 font-semibold text-[#00d289]">{item.code}</td>
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
                      className="text-[#00d289] underline inline-flex items-center gap-1"
                    >
                      YouTube <ExternalLink className="w-4 h-4 inline" />
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">{t('no_link')}</span>
                  )}
                </td>
                <td className="p-2 text-center">
                  {(item.technicianSuggestions?.length ?? 0) > 0 ? (
                    <button
                      onClick={() => setSelectedForSuggestion(item)}
                      className="text-[#00d289] underline hover:text-[#00d289]"
                    >
                      {item.technicianSuggestions?.length}
                    </button>
                  ) : (
                    <span className="text-gray-500">0</span>
                  )}
                </td>
                <td className="p-2 text-sm">{renderReferences(item.technicianReferences || [])}</td>
                <td className="p-2">{item.createdAt?.toDate().toLocaleString()}</td>
                {!isTechnician && !isTechnicianPartner && (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}>
            ← {t('prev')}
          </Button>
          <span>
            {t('page')} {page} / {totalPages}
          </span>
          <Button size="sm" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page === totalPages}>
            {t('next')} →
          </Button>
        </div>
      )}

      {selectedForSuggestion && (
        <Dialog open={!!selectedForSuggestion} onOpenChange={() => setSelectedForSuggestion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t('suggestions_title', { code: selectedForSuggestion.code })}
              </DialogTitle>
            </DialogHeader>
            <TechnicianSuggestionList suggestions={selectedForSuggestion.technicianSuggestions || []} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}