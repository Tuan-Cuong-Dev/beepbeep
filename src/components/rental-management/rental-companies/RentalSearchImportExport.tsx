// Chuẩn hóa ngày 28/08/2025
'use client';

import { useState } from 'react';
import { RentalCompany } from '../../../hooks/useRentalData';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { useTranslation } from 'react-i18next';

interface Props {
  companies: RentalCompany[];
  searchTerm: string;
  onSearch: (term: string) => void;
}

export default function RentalSearchImportExport({ companies, searchTerm, onSearch }: Props) {
  const { t } = useTranslation('common');
  const [filter, setFilter] = useState(''); // giữ chỗ nếu bạn muốn lọc nâng cao sau

  const handleExport = () => {
    exportToExcel(companies, t('rental_search_ie.export_filename'));
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder={t('rental_search_ie.search_placeholder')}
          aria-label={t('rental_search_ie.search_aria')}
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {/* Desktop button */}
      <Button onClick={handleExport} className="hidden md:inline-flex">
        {t('rental_search_ie.export_button')}
      </Button>

      {/* Mobile button (ngắn gọn hơn) */}
      <Button onClick={handleExport} className="md:hidden">
        {t('rental_search_ie.export_button_mobile')}
      </Button>
    </div>
  );
}

export function exportToExcel(data: any[], filename = 'data') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const file = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(file, `${filename}.xlsx`);
}
