'use client';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';

interface Props {
  station: BatteryChargingStation;
}

export default function BatteryChargingStationCard({ station }: Props) {
  return (
    <div className="border rounded-lg p-4 shadow-sm bg-white space-y-1">
      <div className="text-lg font-semibold">{station.name}</div>
      <div className="text-sm text-gray-700">{station.displayAddress}</div>
      {station.openHours && (
        <div className="text-sm text-gray-600">🕒 {station.openHours}</div>
      )}
      {station.chargingPorts && (
        <div className="text-sm">🔌 {station.chargingPorts} ports</div>
      )}
      {station.chargingPowerKW && (
        <div className="text-sm">⚡ {station.chargingPowerKW} kW</div>
      )}
    </div>
  );
}
