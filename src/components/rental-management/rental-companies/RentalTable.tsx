'use client';

import { useState } from 'react';
import { RentalCompany, RentalStation } from '../../../hooks/useRentalData';
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
  const [companyPage, setCompanyPage] = useState(1);
  const [stationPage, setStationPage] = useState(1);

  const perPage = 10;
  const paginatedCompanies = rentalCompanies.slice((companyPage - 1) * perPage, companyPage * perPage);
  const paginatedStations = rentalStations.slice((stationPage - 1) * perPage, stationPage * perPage);

  const renderPagination = (currentPage: number, totalPages: number, setPage: (page: number) => void) => (
    <div className="flex justify-center items-center gap-4 mt-4">
      <Button variant="outline" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
        Previous
      </Button>
      <span className="text-gray-600 text-sm">Page {currentPage} of {totalPages}</span>
      <Button variant="outline" size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
        Next
      </Button>
    </div>
  );

  return (
    <div className="bg-white shadow rounded-xl p-4 mt-4 space-y-10">
      {/* Rental Companies */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">🏢 Rental Companies</h2>

        {/* Mobile view */}
        <div className="md:hidden space-y-4">
          {paginatedCompanies.map((c) => (
            <div key={c.id} className="border p-4 rounded shadow-sm">
              <p className="font-semibold text-gray-800">{c.name}</p>
              <p className="text-sm text-gray-600">📧 {c.email}</p>
              <p className="text-sm text-gray-600">📞 {c.phone}</p>
              <p className="text-sm text-gray-600">📍 {c.displayAddress}</p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => onEditCompany(c)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => onDeleteCompany(c.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full border text-sm">
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
              {paginatedCompanies.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 border">{c.name}</td>
                  <td className="px-3 py-2 border">{c.email}</td>
                  <td className="px-3 py-2 border">{c.phone}</td>
                  <td className="px-3 py-2 border">{c.displayAddress}</td>
                  <td className="px-3 py-2 border whitespace-nowrap">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onEditCompany(c)}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => onDeleteCompany(c.id)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {renderPagination(companyPage, Math.ceil(rentalCompanies.length / perPage), setCompanyPage)}
      </div>

      {/* Rental Stations */}
      <div>
        <h2 className="font-semibold text-lg text-gray-800 mb-2">📍 Rental Stations</h2>

        {/* Mobile view */}
        <div className="md:hidden space-y-4">
          {paginatedStations.map((s) => {
            const company = rentalCompanies.find((c) => c.id === s.companyId);
            return (
              <div key={s.id} className="border p-4 rounded shadow-sm">
                <p className="font-semibold text-gray-800">{s.name}</p>
                <p className="text-sm text-gray-600">🏢 {company?.name || 'Unknown'}</p>
                <p className="text-sm text-gray-600">📍 {s.displayAddress}</p>
                <p className="text-sm text-gray-600">📌 {s.location}</p>
                <p className="text-sm text-gray-600">📞 {s.contactPhone}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => onEditStation(s)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteStation(s.id)}>Delete</Button>
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
                <th className="px-3 py-2 border">Company</th>
                <th className="px-3 py-2 border">Station Name</th>
                <th className="px-3 py-2 border">Address</th>
                <th className="px-3 py-2 border">Location</th>
                <th className="px-3 py-2 border">Contact Phone</th>
                <th className="px-3 py-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedStations.map((s) => {
                const company = rentalCompanies.find((c) => c.id === s.companyId);
                return (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 border">{company?.name || 'Unknown'}</td>
                    <td className="px-3 py-2 border">{s.name}</td>
                    <td className="px-3 py-2 border">{s.displayAddress}</td>
                    <td className="px-3 py-2 border">{s.location}</td>
                    <td className="px-3 py-2 border">{s.contactPhone}</td>
                    <td className="px-3 py-2 border whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => onEditStation(s)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => onDeleteStation(s.id)}>Delete</Button>
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
