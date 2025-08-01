'use client';

import { useTranslation } from 'react-i18next';

interface Props {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: Props) {
  const { t } = useTranslation('common');

  return (
    <div className="flex justify-center items-center gap-4 mt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        {t('pagination.previous')}
      </button>

      <span className="text-sm text-gray-600">
        {t('pagination.page_info', { current: currentPage, total: totalPages })}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
      >
        {t('pagination.next')}
      </button>
    </div>
  );
}
