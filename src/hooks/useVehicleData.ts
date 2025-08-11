'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Vehicle } from '@/src/lib/vehicles/vehicleTypes';
import { VehicleModel } from '@/src/lib/vehicle-models/vehicleModelTypes';
import { useUser } from '@/src/context/AuthContext';

interface UseVehicleDataOptions {
  companyId?: string;
  stationId?: string; // để dành tương lai nếu cần lọc theo trạm
}

export function useVehicleData({ companyId = '' }: UseVehicleDataOptions = {}) {
  const { role } = useUser();

  // Chuẩn hoá role để so sánh chắc chắn
  const normRole = (role || '').toString().toLowerCase();
  const isGlobalAccess = normRole === 'admin' || normRole === 'technician_assistant';

  const [Vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [VehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);

  // ---- VEHICLES ----
  const fetchVehicles = async () => {
    const q = isGlobalAccess
      ? query(collection(db, 'vehicles')) // toàn hệ thống
      : query(collection(db, 'vehicles'), where('companyId', '==', companyId));

    const snapshot = await getDocs(q);
    const data: Vehicle[] = snapshot.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Vehicle, 'id'>),
    }));
    setVehicles(data);
  };

  // ---- MODELS (kèm admin-global catalog) ----
  const fetchModels = async () => {
    const results: VehicleModel[] = [];

    // 1) luôn lấy catalog admin-global
    const qGlobal = query(collection(db, 'vehicleModels'), where('companyId', '==', 'admin-global'));
    const snapGlobal = await getDocs(qGlobal);
    results.push(
      ...snapGlobal.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VehicleModel, 'id'>) }))
    );

    if (isGlobalAccess) {
      if (companyId) {
        // 2a) admin có companyId: lấy thêm model của công ty đó
        const qCompany = query(collection(db, 'vehicleModels'), where('companyId', '==', companyId));
        const snapCompany = await getDocs(qCompany);
        results.push(
          ...snapCompany.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VehicleModel, 'id'>) }))
        );
      } else {
        // 2b) admin không có companyId: lấy tất cả (toàn hệ thống)
        const snapAll = await getDocs(collection(db, 'vehicleModels'));
        results.push(
          ...snapAll.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VehicleModel, 'id'>) }))
        );
      }
    } else if (companyId) {
      // 3) user thường: lấy admin-global + model của công ty user
      // (cũng có thể dùng where in, nhưng 2 query giúp vượt giới hạn 10 phần tử của 'in')
      const qCompany = query(collection(db, 'vehicleModels'), where('companyId', '==', companyId));
      const snapCompany = await getDocs(qCompany);
      results.push(
        ...snapCompany.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VehicleModel, 'id'>) }))
      );
    }

    // Gộp + loại bỏ trùng (theo id)
    const dedup = new Map<string, VehicleModel>();
    for (const m of results) dedup.set(m.id, m);
    setVehicleModels(Array.from(dedup.values()));
  };

  useEffect(() => {
    if (isGlobalAccess || companyId) {
      fetchVehicles();
      fetchModels();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, isGlobalAccess]);

  return {
    Vehicles,
    setVehicles,
    VehicleModels,
    setVehicleModels,
  };
}
