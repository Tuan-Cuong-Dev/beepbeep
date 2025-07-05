'use client';

import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import { Button } from '@/src/components/ui/button';

interface Props {
  stations: BatteryStation[];
  onEdit: (station: BatteryStation) => void;
  onDelete: (id: string) => void;
}

export default function BatteryStationTable({ stations, onEdit, onDelete }: Props) {
  return (
    <div className="space-y-4">
      {/* Card view on mobile */}
      <div className="md:hidden space-y-4">
        {stations.map((station) => (
          <div
            key={station.id}
            className="border rounded-lg p-4 shadow-sm bg-white"
          >
            <div className="font-semibold text-lg mb-1">{station.name}</div>
            <div className="text-sm text-gray-600 mb-1">
              📍 {station.displayAddress}
            </div>
            <div className="text-sm text-gray-700 capitalize">
              🚗 Vehicle: {station.vehicleType}
            </div>
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

      {/* Table view on desktop */}
      <div className="hidden md:block overflow-x-auto rounded-xl border shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {stations.map((station) => (
              <tr key={station.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{station.name}</td>
                <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{station.displayAddress}</td>
                <td className="px-4 py-3 capitalize text-gray-700">{station.vehicleType}</td>
                <td className="px-4 py-3">
                  {station.isActive ? (
                    <span className="text-green-600 font-semibold">Active</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Inactive</span>
                  )}
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
    </div>
  );
}
