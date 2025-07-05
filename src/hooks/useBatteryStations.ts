// 📁 hooks/useBatteryStations.ts
import { useEffect, useState } from 'react';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import {
  fetchBatteryStations,
  createBatteryStation,
  updateBatteryStation,
  deleteBatteryStation,
} from '@/src/lib/batteryStations/batteryStationService';

export function useBatteryStations() {
  const [stations, setStations] = useState<BatteryStation[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStations = async () => {
    setLoading(true);
    const data = await fetchBatteryStations();
    setStations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStations();
  }, []);

  return {
    stations,
    loading,
    reload: loadStations,
    create: createBatteryStation,
    update: updateBatteryStation,
    remove: deleteBatteryStation,
  };
}