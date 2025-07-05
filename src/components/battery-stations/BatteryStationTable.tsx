// 📁 components/battery-stations/BatteryStationTable.tsx
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
    <table className="min-w-full border text-sm">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-4 py-2 text-left">Name</th>
          <th className="px-4 py-2 text-left">Address</th>
          <th className="px-4 py-2 text-left">Vehicle</th>
          <th className="px-4 py-2 text-left">Status</th>
          <th className="px-4 py-2 text-left">Actions</th>
        </tr>
      </thead>
      <tbody>
        {stations.map((station) => (
          <tr key={station.id} className="border-t">
            <td className="px-4 py-2">{station.name}</td>
            <td className="px-4 py-2">{station.displayAddress}</td>
            <td className="px-4 py-2 capitalize">{station.vehicleType}</td>
            <td className="px-4 py-2">
              {station.isActive ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-red-500">Inactive</span>
              )}
            </td>
            <td className="px-4 py-2 space-x-2">
              <Button size="sm" onClick={() => onEdit(station)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(station.id)}>Delete</Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
