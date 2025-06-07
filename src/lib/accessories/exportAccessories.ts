import * as XLSX from 'xlsx';
import { Accessory } from './accessoryTypes';

export const exportAccessoriesToExcel = (accessories: Accessory[]) => {
  const rows = accessories.map((a) => ({
    companyId: a.companyId,
    name: a.name,
    type: a.type,
    code: a.type === 'tracked' ? a.code : '',
    quantity: a.type === 'bulk' ? a.quantity : '',
    status: a.status,
    importDate: a.importDate?.toDate().toISOString().split('T')[0] || '',
    notes: a.notes || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Accessories');
  XLSX.writeFile(workbook, 'accessories.xlsx');
};
