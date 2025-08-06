'use client';

import { Customer } from '@/src/lib/customers/customerTypes';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';

type Props = {
  customers: Customer[];
  onEdit: (c: Customer) => void;
  onDelete: (id: string) => void;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  companyMap: Record<string, string>;
};

export default function CustomerTable({ customers, onEdit, onDelete, searchTerm, setSearchTerm, companyMap }: Props) {
  const { t } = useTranslation('common');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <input
        type="text"
        placeholder={t('customer_table.search_placeholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border mb-4 p-2 rounded w-full"
      />

      <div className="border p-6 rounded shadow-lg bg-white overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-3 py-1">{t('customer_table.columns.name')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.email')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.phone')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.company')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.address')}</th>
              <th className="border px-3 py-1 whitespace-nowrap">{t('customer_table.columns.place_of_residence')}</th>
              <th className="border px-3 py-1 whitespace-nowrap">{t('customer_table.columns.place_of_origin')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.nationality')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.sex')}</th>
              <th className="border px-3 py-1 whitespace-nowrap">{t('customer_table.columns.date_of_birth')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.id_number')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-gray-100">
                <td className="border px-3 py-1 whitespace-nowrap">{c.name}</td>
                <td className="border px-3 py-1">{c.email}</td>
                <td className="border px-3 py-1">{c.phone}</td>
                <td className="border px-3 py-1 whitespace-nowrap">{companyMap[c.companyId] || t('customer_table.unknown_company')}</td>
                <td className="border px-3 py-1 whitespace-nowrap">{c.address}</td>
                <td className="border px-3 py-1 whitespace-nowrap">{c.placeOfResidence || ''}</td>
                <td className="border px-3 py-1 whitespace-nowrap">{c.placeOfOrigin || ''}</td>
                <td className="border px-3 py-1 whitespace-nowrap">{c.nationality || ''}</td>
                <td className="border px-3 py-1">
                  {c.sex ? t(`customer_table.sex_options.${c.sex}`) : ''}
                </td>
                <td className="border px-3 py-1">
                  {c.dateOfBirth?.toDate().toLocaleDateString('vi-VN') || 'N/A'}
                </td>
                <td className="border px-3 py-1">{c.idNumber}</td>
                <td className="border px-3 py-1">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => onEdit(c)}
                      className="bg-[#00d289] hover:bg-green-600 text-white"
                    >
                      {t('customer_table.edit')}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDelete(c.id)}>
                      {t('customer_table.delete')}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
