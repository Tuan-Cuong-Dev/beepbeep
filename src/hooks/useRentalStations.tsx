'use client';

import { useEffect, useState } from 'react';
import { RentalStation } from '@/src/lib/rentalStations/rentalStationTypes';
import {
  fetchRentalStations,
  createRentalStation as _createRentalStation,
  updateRentalStation,
  deleteRentalStation,
} from '@/src/lib/rentalStations/rentalStationService';
import { useAuth } from '@/src/hooks/useAuth';

export function useRentalStations(companyId: string, isAdmin = false) {
  const [stations, setStations] = useState<RentalStation[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth(); // 👈 lấy user

  const loadStations = async () => {
    setLoading(true);
    const data = await fetchRentalStations(companyId, isAdmin);
    setStations(data);
    setLoading(false);
  };

  useEffect(() => {
    if (companyId || isAdmin) {
      loadStations();
    }
  }, [companyId, isAdmin]);

  const create = async (
    data: Omit<RentalStation, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>
  ) => {
    if (!currentUser?.uid) {
      console.warn('No currentUser for createdBy');
      return;
    }
    return await _createRentalStation(data, currentUser.uid);
  };

  return {
    stations,
    loading,
    reload: loadStations,
    create,
    update: updateRentalStation,
    remove: deleteRentalStation,
  };
}
