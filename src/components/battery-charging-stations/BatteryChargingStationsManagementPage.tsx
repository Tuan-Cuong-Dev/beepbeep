'use client';

import { useEffect, useState } from 'react';
import BatteryChargingStationTable from './BatteryChargingStationTable';
import BatteryChargingStationSearchBar from './BatteryChargingStationSearchBar';
import { useBatteryChargingStations } from '@/src/hooks/useBatteryChargingStations';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';

export default function BatteryChargingStationsManagementPage() {
  const { stations, reload } = useBatteryChargingStations();
  const [filtered, setFiltered] = useState<BatteryChargingStation[]>([]);

  useEffect(() => {
    setFiltered(stations);
  }, [stations]);

  const handleSearch = (term: string) => {
    const lower = term.toLowerCase();
    setFiltered(
      stations.filter(
        (s) =>
          s.name.toLowerCase().includes(lower) ||
          s.displayAddress.toLowerCase().includes(lower)
      )
    );
  };

  const handleClear = () => {
    setFiltered(stations);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Battery Charging Stations</h1>
        <BatteryChargingStationSearchBar onSearch={handleSearch} onClear={handleClear} />
      </div>

      <BatteryChargingStationTable stations={filtered} />
    </div>
  );
}
