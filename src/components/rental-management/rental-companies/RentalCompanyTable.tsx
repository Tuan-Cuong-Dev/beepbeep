// Chuẩn hóa ngày 28/08/2025
'use client';

import { useState } from 'react';
import { RentalCompany, RentalStation } from '../../../hooks/useRentalData';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  rentalCompanies: RentalCompany[];
  rentalStations: RentalStation[];
  onEditCompany: (company: RentalCompany) => void;
  onDeleteCompany: (id: string) => void;
}

export default function RentalCompanyTable({
  rentalCompanies,
  rentalStations,
  onEditCompany,
  onDeleteCompany,
}: Props) {
  const { t } = useTranslation('common');

  const [companyPage, setCompanyPage] = useState(1);
  const [stationPage, setStationPage] = useState(1);

  const perPage = 10;
  const totalCompanyPages = Math.max(1, Math.ceil(rentalCompanies.length / perPage));
  const totalStationPages = Math.max(1, Math.ceil(rentalStations.length / perPage));

  const paginatedCompanies = rentalCompanies.slice((companyPage - 1) * perPage, companyPage * perPage);
  const paginatedStations = rentalStations.slice((stationPage - 1) * perPage, stationPage * perPage);

  const renderPagination = (currentPage: number, totalPages: number, setPage: (page: number) => void) => (
    <div className="flex justify-center items-center gap-4 mt-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        {t('rental_company_table.pagination.prev')}
      </Button>
      <span className="text-gray-600 text-sm">
        {t('rental_company_table.pagination.page_of', { current: currentPage, total: totalPages })}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        {t('rental_company_table.pagination.next')}
      </Button>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-xl p-4 mt-4 space-y-10">
      {/* Rental Companies */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">
          {t('rental_company_table.section_companies_title')}
        </h2>

        {/* Mobile list */}
        <div className="md:hidden space-y-4">
          {paginatedCompanies.length === 0 ? (
            <p className="text-sm text-gray-500">{t('rental_company_table.empty_companies')}</p>
          ) : (
            paginatedCompanies.map((c) => (
              <div key={c.id} className="border p-4 rounded shadow-sm">
                <p className="font-semibold text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-600">📧 {c.email || t('rental_company_table.na')}</p>
                <p className="text-sm text-gray-600">📞 {c.phone || t('rental_company_table.na')}</p>
                <p className="text-sm text-gray-600">📍 {c.displayAddress || t('rental_company_table.na')}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => onEditCompany(c)}>
                    {t('rental_company_table.actions.edit')}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDeleteCompany(c.id)}
                  >
                    {t('rental_company_table.actions.delete')}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 border text-left">{t('rental_company_table.columns.name')}</th>
                <th className="px-3 py-2 border text-left">{t('rental_company_table.columns.email')}</th>
                <th className="px-3 py-2 border text-left">{t('rental_company_table.columns.phone')}</th>
                <th className="px-3 py-2 border text-left">{t('rental_company_table.columns.address')}</th>
                <th className="px-3 py-2 border text-left">{t('rental_company_table.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td className="px-3 py-6 border text-center text-gray-500" colSpan={5}>
                    {t('rental_company_table.empty_companies')}
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border">{c.name}</td>
                    <td className="px-3 py-2 border">{c.email || t('rental_company_table.na')}</td>
                    <td className="px-3 py-2 border">{c.phone || t('rental_company_table.na')}</td>
                    <td className="px-3 py-2 border">{c.displayAddress || t('rental_company_table.na')}</td>
                    <td className="px-3 py-2 border whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => onEditCompany(c)}>
                          {t('rental_company_table.actions.edit')}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDeleteCompany(c.id)}
                        >
                          {t('rental_company_table.actions.delete')}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {renderPagination(companyPage, totalCompanyPages, setCompanyPage)}
      </div>
    </div>
  );
}
