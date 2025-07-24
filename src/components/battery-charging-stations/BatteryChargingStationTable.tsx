'use client';

import { useState, useMemo } from 'react';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  stations: BatteryStation[];
  onEdit: (station: BatteryStation) => void;
  onDelete: (id: string) => void;
}

const ITEMS_PER_PAGE = 20;

export default function BatteryChargingStationTable({ stations, onEdit, onDelete }: Props) {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedStations = useMemo(() => {
    return [...stations].sort((a, b) =>
      a.name.localeCompare(b.name, 'en', { sensitivity: 'base' })
    );
  }, [stations]);

  const totalPages = Math.ceil(sortedStations.length / ITEMS_PER_PAGE);
  const paginatedStations = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedStations.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedStations, currentPage]);

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {paginatedStations.map((station) => (
          <div key={station.id} className="border rounded-lg p-4 shadow-sm bg-white">
            <div className="font-semibold text-lg mb-1">{station.name}</div>
            <div className="text-sm text-gray-600 mb-1">📍 {station.displayAddress}</div>
            <div className="text-sm text-gray-700 capitalize">🚗 Vehicle: {station.vehicleType}</div>
            <div className="text-sm mt-1">
              Status:{' '}
              <span className={station.isActive ? 'text-green-600' : 'text-red-500'}>
                {station.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="mt-3 space-x-2">
              <Button size="sm" onClick={() => onEdit(station)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(station.id)}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3">Charging Station</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedStations.map((station) => (
              <tr key={station.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{station.name}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{station.displayAddress}</td>
                <td className="px-4 py-3 capitalize text-gray-700">{station.vehicleType}</td>
                <td className="px-4 py-3">
                  <span className={station.isActive ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold'}>
                    {station.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <Button size="sm" onClick={() => onEdit(station)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(station.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={handlePrev}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={handleNext}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
