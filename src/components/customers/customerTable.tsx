'use client';

import { Customer } from '@/src/lib/customers/customerTypes';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useUser } from '@/src/context/AuthContext'; // ✅ để lấy role

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
  const { user } = useUser();
  const isAdmin = user?.role === 'admin'; // ✅ check role

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Ô tìm kiếm */}
      <input
        type="text"
        placeholder={t('customer_table.search_placeholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="border mb-4 p-2 rounded w-full"
      />

      {/* Table desktop */}
      <div className="hidden md:block border p-6 rounded shadow-lg bg-white overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-3 py-1">{t('customer_table.columns.name')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.email')}</th>
              <th className="border px-3 py-1">{t('customer_table.columns.phone')}</th>

              {/* ✅ Chỉ hiện cột Công ty nếu là admin */}
              {isAdmin && (
                <th className="border px-3 py-1">{t('customer_table.columns.company')}</th>
              )}

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

                {/* ✅ Chỉ hiện giá trị Công ty nếu là admin */}
                {isAdmin && (
                  <td className="border px-3 py-1 whitespace-nowrap">
                    {companyMap[c.companyId ?? ''] || t('customer_table.unknown_company')}
                  </td>
                )}

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

      {/* Card UI mobile */}
      <div className="grid gap-4 md:hidden">
        {filtered.map((c) => (
          <div key={c.id} className="border rounded-lg p-4 shadow bg-white">
            <h3 className="text-lg font-semibold mb-1">{c.name}</h3>
            <p className="text-sm text-gray-600 mb-2">{c.email}</p>
            <p className="text-sm"><strong>{t('customer_table.columns.phone')}:</strong> {c.phone}</p>

            {/* ✅ Chỉ hiện trong card nếu là admin */}
            {isAdmin && (
              <p className="text-sm">
                <strong>{t('customer_table.columns.company')}:</strong> {companyMap[c.companyId ?? ''] || t('customer_table.unknown_company')}
              </p>
            )}

            <p className="text-sm"><strong>{t('customer_table.columns.address')}:</strong> {c.address}</p>
            {c.placeOfResidence && <p className="text-sm"><strong>{t('customer_table.columns.place_of_residence')}:</strong> {c.placeOfResidence}</p>}
            {c.placeOfOrigin && <p className="text-sm"><strong>{t('customer_table.columns.place_of_origin')}:</strong> {c.placeOfOrigin}</p>}
            {c.nationality && <p className="text-sm"><strong>{t('customer_table.columns.nationality')}:</strong> {c.nationality}</p>}
            {c.sex && <p className="text-sm"><strong>{t('customer_table.columns.sex')}:</strong> {t(`customer_table.sex_options.${c.sex}`)}</p>}
            <p className="text-sm"><strong>{t('customer_table.columns.date_of_birth')}:</strong> {c.dateOfBirth?.toDate().toLocaleDateString('vi-VN') || 'N/A'}</p>
            <p className="text-sm"><strong>{t('customer_table.columns.id_number')}:</strong> {c.idNumber}</p>

            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => onEdit(c)}
                className="flex-1 bg-[#00d289] hover:bg-green-600 text-white"
              >
                {t('customer_table.edit')}
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(c.id)}
                className="flex-1"
              >
                {t('customer_table.delete')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
