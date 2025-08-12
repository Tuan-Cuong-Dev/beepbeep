// Hooks xử lý các dịch vụ của người dùng

'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { UserService } from '@/src/lib/vehicle-services/userServiceTypes';
import type { ServiceCategoryKey, SupportedServiceType } from '@/src/lib/vehicle-services/serviceTypes';

type ServiceStatus = 'pending' | 'approved' | 'rejected';

interface UseUserServicesOptions {
  userId: string;
  allowedCategories?: ServiceCategoryKey[];
}

/** 🔧 Chuẩn hóa payload trước khi lưu
 * - Ưu tiên location; nếu chưa có, map từ storeLocation
 * - Làm phẳng mảng multi-select nếu có lỡ gửi key dịch dạng 'options.xxx.yyy'
 * - Loại undefined để tránh ghi field rác
 */
function normalizeServicePayload(input: Record<string, any>) {
  const out: Record<string, any> = {};

  for (const [k, v] of Object.entries(input ?? {})) {
    if (v === undefined) continue;

    // Chuẩn hóa array: ['options.vehicleType.motorbike'] -> ['motorbike']
    if (Array.isArray(v)) {
      out[k] = v.map((item) => {
        if (typeof item === 'string' && item.includes('.')) {
          // lấy phần cuối cùng sau dấu chấm
          const parts = item.split('.');
          return parts[parts.length - 1];
        }
        return item;
      });
      continue;
    }

    out[k] = v;
  }

  // Ưu tiên location, fallback từ storeLocation
  if (!out.location && typeof out.storeLocation === 'string') {
    out.location = out.storeLocation;
  }

  return out;
}

export function useUserServices({ userId, allowedCategories }: UseUserServicesOptions) {
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchServices = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const q = query(collection(db, 'services'), where('userId', '==', userId));
      const snap = await getDocs(q);

      let data = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as UserService[];

      if (allowedCategories?.length) {
        data = data.filter((s) => allowedCategories.includes(s.category));
      }

      setServices(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [userId, allowedCategories]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  /** ➕ Thêm dịch vụ — nhận nguyên payload để không rơi field */
  const addService = async (
    category: ServiceCategoryKey,
    serviceType: SupportedServiceType,
    payload: Record<string, any> // nhận full formData từ DynamicServiceForm
  ) => {
    try {
      const data = normalizeServicePayload(payload);

      await addDoc(collection(db, 'services'), {
        ...data, // giữ đầy đủ: workingHours, rentalTerms, ...
        category,
        serviceType,
        status: 'pending' as ServiceStatus,
        userId,
        createdAt: serverTimestamp(),
      });

      await fetchServices();
    } catch (err) {
      setError(err as Error);
    }
  };

  /** ✏️ Cập nhật dịch vụ — cho phép update mọi field cần thiết */
  const updateService = async (id: string, updatedData: Record<string, any>) => {
    try {
      const ref = doc(db, 'services', id);
      const data = normalizeServicePayload(updatedData);

      await updateDoc(ref, {
        ...data,
        updatedAt: serverTimestamp(),
      });

      await fetchServices();
    } catch (err) {
      setError(err as Error);
    }
  };

  /** 🗑️ Xóa dịch vụ */
  const deleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'services', id));
      await fetchServices();
    } catch (err) {
      setError(err as Error);
    }
  };

  return {
    services,
    loading,
    error,
    fetchServices,
    addService,
    updateService,
    deleteService,
  };
}
