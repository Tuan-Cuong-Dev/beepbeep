'use client';

import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';

interface Props {
  stations: BatteryChargingStation[];
}

export default function BatteryChargingStationTable({ stations }: Props) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Address</th>
            <th className="px-4 py-2">Ports</th>
            <th className="px-4 py-2">Power (kW)</th>
            <th className="px-4 py-2">Hours</th>
          </tr>
        </thead>
        <tbody>
          {stations.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="px-4 py-2">{s.name}</td>
              <td className="px-4 py-2">{s.displayAddress}</td>
              <td className="px-4 py-2">{s.chargingPorts ?? '-'}</td>
              <td className="px-4 py-2">{s.chargingPowerKW ?? '-'}</td>
              <td className="px-4 py-2">{s.openHours ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
