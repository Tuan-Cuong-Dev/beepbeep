import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ServicePricing } from '@/src/lib/servicePricing/servicePricingTypes';

export function usePublicServicePricing() {
  const [services, setServices] = useState<ServicePricing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const q = query(collection(db, 'servicePricings'), where('isActive', '==', true));
      const snapshot = await getDocs(q);

      const data: ServicePricing[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ServicePricing[];

      setServices(data);
      setLoading(false);
    };

    fetchServices();
  }, []);

  return { services, loading };
}
