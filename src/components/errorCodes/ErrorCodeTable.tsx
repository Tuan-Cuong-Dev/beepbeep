'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash, ExternalLink } from 'lucide-react';
import { ErrorCode } from '@/src/lib/errorCodes/errorCodeTypes';
import { useUser } from '@/src/context/AuthContext';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/src/components/ui/dialog';
import TechnicianSuggestionList from './TechnicianSuggestionList';

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
  const isTechOrPartner = isTechnician || isTechnicianPartner;

  const { t } = useTranslation('common', { keyPrefix: 'error_code_table' });

  // --- Local states
  const [searchTerm, setSearchTerm] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [selectedForSuggestion, setSelectedForSuggestion] = useState<ErrorCode | null>(null);
  const [page, setPage] = useState(1);

  // --- Derived values
  const uniqueBrands = useMemo(
    () => Array.from(new Set(errorCodes.map(e => e.brand).filter(Boolean))) as string[],
    [errorCodes]
  );

  const filtered = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    return errorCodes.filter((e) => {
      const matchesSearch = s
        ? `${e.code} ${e.description ?? ''} ${e.recommendedSolution ?? ''}`.toLowerCase().includes(s)
        : true;
      const matchesBrand = brandFilter ? e.brand === brandFilter : true;
      return matchesSearch && matchesBrand;
    });
  }, [errorCodes, searchTerm, brandFilter]);

  // Reset về trang 1 khi nguồn dữ liệu hoặc filter/tìm kiếm thay đổi
  useEffect(() => {
    setPage(1);
  }, [searchTerm, brandFilter, errorCodes]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginatedItems = useMemo(
    () => filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE),
    [filtered, page]
  );

  const renderReferences = (refs?: { name?: string; phone?: string }[]) => {
    if (!refs?.length) return '—';
    return refs
      .map((r) => `${r?.name || 'N/A'} – ${r?.phone || 'N/A'}`)
      .join(', ');
  };

  const EmptyState = (
    <div className="border border-dashed rounded-xl py-12 text-center text-sm text-gray-600 bg-white">
      <div className="text-3xl mb-2">🛠️</div>
      {t('no_records', { defaultValue: 'Không có dữ liệu phù hợp' })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Input
          placeholder={t('search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="border rounded px-3 py-2 text-sm text-gray-700"
        >
          <option value="">{t('all_brands')}</option>
          {uniqueBrands.map((brand) => (
            <option key={brand} value={brand}>
              {brand}
            </option>
          ))}
        </select>
      </div>

      {/* 📱 Mobile Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:hidden">
        {paginatedItems.length === 0 ? (
          EmptyState
        ) : (
          paginatedItems.map((item) => (
            <div key={item.id} className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-bold text-[#00d289] line-clamp-2">{item.description}</h3>
                {!isTechOrPartner && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => onEdit(item)} aria-label={t('edit')}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(item)} aria-label={t('delete')}>
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-800 grid gap-1">
                <p>{t('code')}: <span className="font-medium">{item.code}</span></p>
                <p className="text-gray-700 italic">💡 {item.recommendedSolution}</p>
                <p className="text-gray-500">📦 {t('brand')}: {item.brand || '-'}</p>
                <p className="text-gray-500">🚗 {t('model')}: {item.modelName || '-'}</p>
                <p className="text-gray-500">
                  🎥 {t('video')}:{" "}
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
                <p className="text-gray-500">
                  🛠 {t('suggestions')}:{" "}
                  {(item.technicianSuggestions?.length ?? 0) > 0 ? (
                    <button
                      onClick={() => setSelectedForSuggestion(item)}
                      className="text-[#00d289] underline"
                    >
                      {item.technicianSuggestions?.length}
                    </button>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </p>
                <p className="text-gray-500">
                  📞 {t('reference')}: {renderReferences(item.technicianReferences)}
                </p>
                <p className="text-gray-500">
                  🕒 {t('created_at')}: {item.createdAt?.toDate().toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🖥️ Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm border rounded-lg overflow-hidden bg-white">
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
              {!isTechOrPartner && <th className="p-2 text-left">{t('actions')}</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={isTechOrPartner ? 9 : 10} className="py-10">
                  {EmptyState}
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{item.code}</td>
                  <td className="p-2 font-semibold text-[#00d289]">{item.description}</td>
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
                  <td className="p-2">
                    {(item.technicianSuggestions?.length ?? 0) > 0 ? (
                      <button
                        onClick={() => setSelectedForSuggestion(item)}
                        className="text-[#00d289] underline hover:text-[#00b574]"
                      >
                        {item.technicianSuggestions?.length}
                      </button>
                    ) : (
                      <span className="text-gray-500">0</span>
                    )}
                  </td>
                  <td className="p-2 text-sm">{renderReferences(item.technicianReferences)}</td>
                  <td className="p-2">{item.createdAt?.toDate().toLocaleString()}</td>
                  {!isTechOrPartner && (
                    <td className="p-2">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(item)} aria-label={t('edit')}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => onDelete(item)} aria-label={t('delete')}>
                          <Trash className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-8 py-2">
          {/* Trước */}
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className={[
              "min-w-[84px] px-4 py-2 rounded-lg",
              "bg-gray-100 ",
              page === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-800 hover:bg-gray-200"
            ].join(" ")}
          >
            {t('pagination.prev_short', { defaultValue: 'Trước' })}
          </button>

          {/* Trang X / Y */}
          <span className="text-sm text-gray-700">
            {t('pagination.page_label', { defaultValue: 'Trang' })} {page} / {totalPages}
          </span>

          {/* Sau */}
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className={[
              "min-w-[84px] px-4 py-2 rounded-lg",
              "bg-gray-100 ",
              page === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-900 font-semibold hover:bg-gray-200"
            ].join(" ")}
          >
            {t('pagination.next_short', { defaultValue: 'Sau' })}
          </button>
        </div>
      )}


      {/* Technician Suggestions Dialog */}
      {selectedForSuggestion && (
        <Dialog open={!!selectedForSuggestion} onOpenChange={() => setSelectedForSuggestion(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('suggestions_title', { code: selectedForSuggestion.code })}</DialogTitle>
            </DialogHeader>
            <TechnicianSuggestionList suggestions={selectedForSuggestion.technicianSuggestions || []} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
