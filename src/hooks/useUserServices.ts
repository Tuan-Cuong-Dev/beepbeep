// Hooks xữ lý các dịch vụ của người dùng 

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
import { UserService, ServiceStatus } from '@/src/lib/vehicle-services/userServiceTypes';
import { ServiceCategoryKey, SupportedServiceType } from '@/src/lib/vehicle-services/serviceTypes';

interface UseUserServicesOptions {
  userId: string;
  allowedCategories?: ServiceCategoryKey[];
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

      if (allowedCategories && allowedCategories.length > 0) {
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

  const addService = async (
    category: ServiceCategoryKey,
    serviceType: SupportedServiceType,
    data: {
      name: string;
      description?: string;
      vehicleTypes: string[];
      location?: string;
    }
  ) => {
    try {
      await addDoc(collection(db, 'services'), {
        ...data,
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

  const updateService = async (id: string, updatedData: Partial<UserService>) => {
    try {
      const ref = doc(db, 'services', id);
      await updateDoc(ref, {
        ...updatedData,
        updatedAt: serverTimestamp(),
      });
      await fetchServices();
    } catch (err) {
      setError(err as Error);
    }
  };

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
