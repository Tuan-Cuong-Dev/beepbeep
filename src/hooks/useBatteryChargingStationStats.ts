import { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export default function useBatteryChargingStationStats() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const snapshot = await getCountFromServer(collection(db, 'batteryChargingStations'));
        setCount(snapshot.data().count);
      } catch (error) {
        console.error('Failed to fetch battery charging station count:', error);
      }
    };
    fetchCount();
  }, []);

  return count;
}
