'use client';

import { useBatteryChargingStations } from '@/src/hooks/useBatteryChargingStations';
import BatteryChargingStationCard from './BatteryChargingStationCard';
import BatteryChargingStationMap from './BatteryChargingStationMap';

export default function BatteryChargingStationsClientPage() {
  const { stations, loading } = useBatteryChargingStations();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Battery Charging Stations</h1>
      <BatteryChargingStationMap stations={stations} />
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stations.map((station) => (
            <BatteryChargingStationCard key={station.id} station={station} />
          ))}
        </div>
      )}
    </div>
  );
}
