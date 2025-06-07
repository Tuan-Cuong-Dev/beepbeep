'use client';

import { useState } from 'react';
import { RentalCompany, RentalStation } from '../../../hooks/useCompanyData';
import { Button } from '@/src/components/ui/button';

interface Props {
  rentalCompanies: RentalCompany[];
  rentalStations: RentalStation[];
  onEditCompany: (company: RentalCompany) => void;
  onDeleteCompany: (id: string) => void;
  onEditStation: (station: RentalStation) => void;
  onDeleteStation: (id: string) => void;
}

export default function RentalTable({
  rentalCompanies,
  rentalStations,
  onEditCompany,
  onDeleteCompany,
  onEditStation,
  onDeleteStation,
}: Props) {
  const COMPANIES_PER_PAGE = 10;
  const STATIONS_PER_PAGE = 10;

  const [companyPage, setCompanyPage] = useState(1);
  const [stationPage, setStationPage] = useState(1);

  const totalCompanyPages = Math.ceil(rentalCompanies.length / COMPANIES_PER_PAGE);
  const totalStationPages = Math.ceil(rentalStations.length / STATIONS_PER_PAGE);

  const paginatedCompanies = rentalCompanies.slice(
    (companyPage - 1) * COMPANIES_PER_PAGE,
    companyPage * COMPANIES_PER_PAGE
  );

  const paginatedStations = rentalStations.slice(
    (stationPage - 1) * STATIONS_PER_PAGE,
    stationPage * STATIONS_PER_PAGE
  );

  const renderPagination = (
    currentPage: number,
    totalPages: number,
    setPage: (page: number) => void
  ) => (
    <div className="flex justify-center items-center gap-4 mt-4">
      <button
        className={`px-4 py-2 rounded border text-sm transition 
        ${currentPage === 1
            ? 'text-gray-400 border-gray-200 bg-white cursor-not-allowed'
            : 'text-gray-800 border-gray-300 hover:bg-gray-100'
          }`}
        disabled={currentPage === 1}
        onClick={() => setPage(currentPage - 1)}
      >
        Previous
      </button>

      <span className="text-gray-600 text-sm">
        Page {currentPage} of {totalPages}
      </span>

      <button
        className={`px-4 py-2 rounded border text-sm transition 
        ${currentPage === totalPages
            ? 'text-gray-400 border-gray-200 bg-white cursor-not-allowed'
            : 'text-gray-800 border-gray-300 hover:bg-gray-100'
          }`}
        disabled={currentPage === totalPages}
        onClick={() => setPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-xl p-4 mt-4 space-y-10">
      {/* Rental Companies Table */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">🏢 Rental Companies</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 border">Name</th>
                <th className="px-3 py-2 border">Email</th>
                <th className="px-3 py-2 border">Phone</th>
                <th className="px-3 py-2 border">Address</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCompanies.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">
                    No rental companies found.
                  </td>
                </tr>
              ) : (
                paginatedCompanies.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 border">{c.name}</td>
                    <td className="px-3 py-2 border">{c.email}</td>
                    <td className="px-3 py-2 border">{c.phone}</td>
                    <td className="px-3 py-2 border">{c.displayAddress}</td>
                    <td className="px-3 py-2 border whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={() => onEditCompany(c)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => onDeleteCompany(c.id)}>Delete</Button>
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

      {/* Rental Stations Table */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">📍 Rental Stations</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-3 py-2 border">Company</th>
                <th className="px-3 py-2 border">Station Name</th>
                <th className="px-3 py-2 border">Address</th>
                <th className="px-3 py-2 border">Location</th>
                <th className="px-3 py-2 border text-center">eBikes</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-gray-500">
                    No rental stations found.
                  </td>
                </tr>
              ) : (
                paginatedStations.map((s) => {
                  const company = rentalCompanies.find((c) => c.id === s.companyId);
                  return (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 border">{company?.name || 'Unknown'}</td>
                      <td className="px-3 py-2 border">{s.name}</td>
                      <td className="px-3 py-2 border">{s.displayAddress}</td>
                      <td className="px-3 py-2 border">{s.location}</td>
                      <td className="px-3 py-2 border text-center">{s.totalEbikes}</td>
                      <td className="px-3 py-2 border whitespace-nowrap">
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => onEditStation(s)}>Edit</Button>
                          <Button size="sm" variant="destructive" onClick={() => onDeleteStation(s.id)}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {renderPagination(stationPage, totalStationPages, setStationPage)}
      </div>
    </div>
  );
}
