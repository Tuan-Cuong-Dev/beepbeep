'use client';

import { useEffect, useState } from 'react';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';
import {
  fetchBatteryChargingStations,
  createBatteryChargingStation as _createBatteryChargingStation,
  updateBatteryChargingStation,
  deleteBatteryChargingStation,
} from '@/src/lib/batteryChargingStations/batteryChargingStationService';
import { useAuth } from '@/src/hooks/useAuth';

export function useBatteryChargingStations() {
  const [stations, setStations] = useState<BatteryChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  const loadStations = async () => {
    setLoading(true);
    const data = await fetchBatteryChargingStations();
    setStations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStations();
  }, []);

  const create = async (
    data: Omit<BatteryChargingStation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    if (!currentUser?.uid) {
      console.warn('No user ID found when creating battery charging station');
      return;
    }
    return await _createBatteryChargingStation(data, currentUser.uid);
  };

  const getDefaultValues = (): Omit<
    BatteryChargingStation,
    'id' | 'createdAt' | 'updatedAt' | 'createdBy'
  > => ({
    name: '',
    displayAddress: '',
    mapAddress: '',
    phone: '',
    coordinates: undefined,
    vehicleType: 'motorbike',
    description: '',
    isActive: false,
  });

  return {
    stations,
    loading,
    reload: loadStations,
    create,
    update: updateBatteryChargingStation,
    remove: deleteBatteryChargingStation,
    getDefaultValues,
  };
}
