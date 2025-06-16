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

export function useServicePricings() {
  const [servicePricings, setServicePricings] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServicePricings();
  }, []);

  const fetchServicePricings = async () => {
    setLoading(true);
    const q = query(collection(db, 'servicePricings'));
    const snap = await getDocs(q);
    const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ServicePricing));
    setServicePricings(data);
    setLoading(false);
  };

  const createServicePricing = async (data: Omit<ServicePricing, 'id' | 'createdAt'>) => {
    const docRef = await addDoc(collection(db, 'servicePricings'), {
      ...data,
      createdAt: Timestamp.now(),
    });
    await fetchServicePricings();
    return docRef.id;
  };

  const updateServicePricing = async (id: string, data: Partial<ServicePricing>) => {
    await updateDoc(doc(db, 'servicePricings', id), data);
    await fetchServicePricings();
  };

  const deleteServicePricing = async (id: string) => {
    await deleteDoc(doc(db, 'servicePricings', id));
    await fetchServicePricings();
  };

  return {
    servicePricings,
    loading,
    createServicePricing,
    updateServicePricing,
    deleteServicePricing,
  };
}
