'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { useUser } from '@/src/context/AuthContext';

interface UseVehicleDataOptions {
  companyId?: string;
  stationId?: string;
  isAdmin?: boolean;
}

export function useVehicleData({ companyId = '' }: UseVehicleDataOptions = {}) {
  const { role } = useUser();

  // 👇 Tự động xác định nếu có quyền truy cập toàn hệ thống
  const isGlobalAccess = role === 'Admin' || role === 'technician_assistant';

  const [Vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [VehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);

  const fetchVehicles = async () => {
    const q = isGlobalAccess
      ? query(collection(db, 'vehicles'))
      : query(collection(db, 'vehicles'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const data: Vehicle[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Vehicle, 'id'>),
    }));
    setVehicles(data);
  };

  const fetchModels = async () => {
    const q = isGlobalAccess
      ? query(collection(db, 'vehicleModels'))
      : query(collection(db, 'vehicleModels'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const data: VehicleModel[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<VehicleModel, 'id'>),
    }));
    setVehicleModels(data);
  };

  useEffect(() => {
    if (isGlobalAccess || companyId) {
      fetchVehicles();
      fetchModels();
    }
  }, [companyId, isGlobalAccess]);

  return {
    Vehicles,
    setVehicles,
    VehicleModels,
    setVehicleModels,
  };
}
