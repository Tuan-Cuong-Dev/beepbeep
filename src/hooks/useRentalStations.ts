// hooks/useRentalStations.ts
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import type {
  RentalStation,
  RentalStationFormValues,
  StationStatus,
  VehicleType,
} from '@/src/lib/rentalStations/rentalStationTypes';
import {
  fetchRentalStations,
  createRentalStation as _createRentalStation,
  updateRentalStation as _updateRentalStation,
  deleteRentalStation as _deleteRentalStation,
} from '@/src/lib/rentalStations/rentalStationService';
import { useAuth } from '@/src/hooks/useAuth';

type UseRentalStationsOptions = {
  /** Lấy theo company; nếu isAdmin=true có thể để trống để lấy tất cả */
  companyId?: string;
  /** Admin có thể xem tất cả */
  isAdmin?: boolean;
  /** Lọc tuỳ chọn */
  status?: StationStatus;
  vehicleType?: VehicleType;
};

export function useRentalStations(
  companyIdOrOptions: string | UseRentalStationsOptions,
  isAdminFlag = false
) {
  // Back-compat: giữ chữ ký cũ (companyId: string, isAdmin=false)
  const opts: UseRentalStationsOptions =
    typeof companyIdOrOptions === 'string'
      ? { companyId: companyIdOrOptions, isAdmin: isAdminFlag }
      : companyIdOrOptions;

  const { companyId, isAdmin = false, status, vehicleType } = opts;

  const [stations, setStations] = useState<RentalStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const { currentUser } = useAuth();

  // tránh setState sau khi unmount
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // service nên hỗ trợ lọc status/vehicleType (nếu không, có thể lọc client-side)
      const data = await fetchRentalStations({
        companyId,
        isAdmin,
        status,
        vehicleType,
      });
      if (!alive.current) return;
      setStations(data);
    } catch (e) {
      if (!alive.current) return;
      setError(e);
    } finally {
      if (alive.current) setLoading(false);
    }
  }, [companyId, isAdmin, status, vehicleType]);

  useEffect(() => {
    // Điều kiện tải: admin (không cần companyId) hoặc có companyId
    if (isAdmin || companyId) {
      loadStations();
    } else {
      // không đủ điều kiện -> reset
      setStations([]);
      setLoading(false);
    }
  }, [companyId, isAdmin, status, vehicleType, loadStations]);

  /**
   * Tạo mới trạm:
   * - nhận dữ liệu form + companyId (nếu chưa truyền qua hook)
   * - service sẽ map -> NewRentalStation, gắn createdBy/timestamps
   */
  const create = useCallback(
    async (form: RentalStationFormValues & { companyId?: string }) => {
      if (!currentUser?.uid) {
        throw new Error('Missing currentUser to set createdBy');
      }
      const cid = form.companyId ?? companyId;
      if (!cid) {
        throw new Error('companyId is required to create a station');
      }

      const created = await _createRentalStation(
        { ...form, companyId: cid },
        currentUser.uid
      );

      // optimistic refresh
      setStations(prev => [created, ...prev]);
      return created;
    },
    [currentUser?.uid, companyId]
  );

  /**
   * Cập nhật trạm:
   * - chỉ truyền các trường thay đổi (Partial)
   * - service sẽ set updatedAt
   */
  const update = useCallback(
    async (id: string, patch: Partial<RentalStation>) => {
      const updated = await _updateRentalStation(id, patch);
      setStations(prev =>
        prev.map(s => (s.id === id ? { ...s, ...updated } : s))
      );
      return updated;
    },
    []
  );

  /** Xoá trạm */
  const remove = useCallback(async (id: string) => {
    await _deleteRentalStation(id);
    setStations(prev => prev.filter(s => s.id !== id));
  }, []);

  return {
    stations,
    loading,
    error,
    reload: loadStations,
    create,
    update,
    remove,
  };
}
