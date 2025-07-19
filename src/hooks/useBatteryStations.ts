// 📁 hooks/useBatteryStations.ts'use client';

import { useEffect, useState } from 'react';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import {
  fetchBatteryStations,
  createBatteryStation as _createBatteryStation,
  updateBatteryStation,
  deleteBatteryStation,
} from '@/src/lib/batteryStations/batteryStationService';
import { useAuth } from '@/src/hooks/useAuth'; // bạn cần hook này để lấy currentUser

export function useBatteryStations() {
  const [stations, setStations] = useState<BatteryStation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth(); // 👈 lấy user từ context

  const loadStations = async () => {
    setLoading(true);
    const data = await fetchBatteryStations();
    setStations(data);
    setLoading(false);
  };

  useEffect(() => {
    loadStations();
  }, []);

  // ✅ Tạo bản wrapper để truyền thêm createdBy
  const create = async (data: Omit<BatteryStation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => {
    if (!currentUser?.uid) {
      console.warn('No user ID found when creating battery station');
      return;
    }
    return await _createBatteryStation(data, currentUser.uid);
  };

  return {
    stations,
    loading,
    reload: loadStations,
    create,
    update: updateBatteryStation,
    remove: deleteBatteryStation,
  };
}
