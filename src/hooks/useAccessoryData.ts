import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Accessory } from '@/src/lib/accessories/accessoryTypes';

export const useAccessoryData = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'accessories'));
        const data = snapshot.docs.map((doc) => {
          const raw = doc.data();
          return {
            id: doc.id,
            name: raw.name || '',
            companyId: raw.companyId || '',
            type: raw.type || 'tracked',
            code: raw.code || '',
            quantity: raw.quantity ?? undefined,
            status: raw.status || 'in_stock',
            importDate: raw.importDate,
            importedDate: raw.importedDate,
            exportDate: raw.exportDate,
            notes: raw.notes || '',
            updatedAt: raw.updatedAt,
            importPrice: raw.importPrice ?? undefined,
            retailPrice: raw.retailPrice ?? undefined,
          } as Accessory;
        });
        setAccessories(data);
      } catch (error) {
        console.error('Failed to fetch accessories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { accessories, setAccessories, loading };
};
