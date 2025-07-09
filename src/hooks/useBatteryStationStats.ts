import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export default function useBatteryStationStats() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const q = query(collection(db, 'batteryStations'), where('isActive', '==', true));
      const snap = await getDocs(q);
      setCount(snap.size);
    };
    fetch();
  }, []);

  return count;
}
