import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';

// Define reusable types
export type NewServicePricing = Omit<ServicePricing, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateServicePricing = Partial<ServicePricing>;

export function useServicePricings() {
  const [servicePricings, setServicePricings] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchServicePricings = async () => {
    setLoading(true);
    const q = query(collection(db, 'servicePricings'));
    const snap = await getDocs(q);
    const data = snap.docs.map((docSnap) => {
      const raw = docSnap.data();
      return {
        id: docSnap.id,
        ...raw,
      } as ServicePricing;
    });
    setServicePricings(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchServicePricings();
  }, []);

  const createServicePricing = async (data: NewServicePricing) => {
    await addDoc(collection(db, 'servicePricings'), {
      ...data,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    await fetchServicePricings();
  };

  const updateServicePricing = async (id: string, data: UpdateServicePricing) => {
    await updateDoc(doc(db, 'servicePricings', id), {
      ...data,
      updatedAt: Timestamp.now(),
    });
    await fetchServicePricings();
  };

  const deleteServicePricing = async (id: string) => {
    await deleteDoc(doc(db, 'servicePricings', id));
    await fetchServicePricings();
  };

  return {
    servicePricings,
    loading,
    fetchServicePricings,
    createServicePricing,
    updateServicePricing,
    deleteServicePricing,
  };
}
