// hooks/useAccessoryData.ts
import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Accessory } from '@/src/lib/accessories/accessoryTypes';

export const useAccessoryData = () => {
  const [accessories, setAccessories] = useState<Accessory[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'accessories'));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Accessory[];
      setAccessories(data);
    };
    fetchData();
  }, []);

  return { accessories, setAccessories };
};
