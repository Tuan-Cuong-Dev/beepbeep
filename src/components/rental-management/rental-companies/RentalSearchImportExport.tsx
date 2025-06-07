// RentalSearchImportExport.tsx

import { useState } from 'react';
import { RentalCompany } from '../../../hooks/useCompanyData';
import { Input } from '@/src/components/ui/input';
import { Button } from '@/src/components/ui/button';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


interface Props {
  companies: RentalCompany[];
  searchTerm: string;
  onSearch: (term: string) => void;
}

export default function RentalSearchImportExport({ companies, searchTerm, onSearch }: Props) {
  const [filter, setFilter] = useState('');

  const handleExport = () => {
    exportToExcel(companies, 'Rental_Companies');
  };

  return (
    <div className="flex flex-col md:flex-row md:items-end gap-4 mb-6">
      <div className="flex-1">
        <Input
          placeholder="🔍 Search company name..."
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      <Button onClick={handleExport}>📤 Export to Excel</Button>
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