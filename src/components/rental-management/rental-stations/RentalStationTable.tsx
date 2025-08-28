// Dành cho Admin quản lí trạm cho thuê
// src/components/rental-management/rental-stations

// src/components/rental-management/rental-stations/RentalStationTable.tsx
'use client';

import { useState } from 'react';
import { RentalCompany, RentalStation } from '../../../hooks/useRentalData';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  rentalCompanies: RentalCompany[];
  rentalStations: RentalStation[];
  onEditStation: (station: RentalStation) => void;
  onDeleteStation: (id: string) => void;
}

export default function RentalStationTable({
  rentalCompanies,
  rentalStations,
  onEditStation,
  onDeleteStation,
}: Props) {
  const { t } = useTranslation('common');
  const [stationPage, setStationPage] = useState(1);

  const perPage = 10;
  const paginatedStations = rentalStations.slice((stationPage - 1) * perPage, stationPage * perPage);

  const renderPagination = (currentPage: number, totalPages: number, setPage: (page: number) => void) => (
    <div className="flex justify-center items-center gap-4 mt-4">
      <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
        {t('rental_station_table.previous')}
      </Button>
      <span className="text-gray-600 text-sm">{t('rental_station_table.page', { current: currentPage, total: totalPages })}</span>
      <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
        {t('rental_station_table.next')}
      </Button>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-xl p-4 mt-4 space-y-10">
      {/* Rental Stations */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">{t('rental_station_table.stations_title')}</h2>

        {/* Mobile view */}
        <div className="md:hidden space-y-4">
          {paginatedStations.map((s) => {
            const company = rentalCompanies.find((c) => c.id === s.companyId);
            return (
              <div key={s.id} className="border p-4 rounded shadow-sm">
                <p className="font-semibold text-gray-800">{s.name}</p>
                <p className="text-sm text-gray-600">🏢 {company?.name || t('rental_station_table.unknown')}</p>
                <p className="text-sm text-gray-600">📍 {s.displayAddress}</p>
                <p className="text-sm text-gray-600">📌 {s.location}</p>
                <p className="text-sm text-gray-600">📞 {s.contactPhone}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => onEditStation(s)}>{t('rental_station_table.edit')}</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteStation(s.id)}>{t('rental_station_table.delete')}</Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 border">{t('rental_station_table.company')}</th>
                <th className="px-3 py-2 border">{t('rental_station_table.station_name')}</th>
                <th className="px-3 py-2 border">{t('rental_station_table.address')}</th>
                <th className="px-3 py-2 border">{t('rental_station_table.location')}</th>
                <th className="px-3 py-2 border">{t('rental_station_table.contact_phone')}</th>
                <th className="px-3 py-2 border">{t('rental_station_table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStations.map((s) => {
                const company = rentalCompanies.find((c) => c.id === s.companyId);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border">{company?.name || t('rental_station_table.unknown')}</td>
                    <td className="px-3 py-2 border">{s.name}</td>
                    <td className="px-3 py-2 border">{s.displayAddress}</td>
                    <td className="px-3 py-2 border">{s.location}</td>
                    <td className="px-3 py-2 border">{s.contactPhone}</td>
                    <td className="px-3 py-2 border whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => onEditStation(s)}>{t('rental_station_table.edit')}</Button>
                        <Button size="sm" variant="destructive" onClick={() => onDeleteStation(s.id)}>{t('rental_station_table.delete')}</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {renderPagination(stationPage, Math.ceil(rentalStations.length / perPage), setStationPage)}
      </div>
    </div>
  );
}
