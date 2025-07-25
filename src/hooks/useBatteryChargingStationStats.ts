import { useEffect, useState } from 'react';
import { collection, getCountFromServer } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';

export function useBatteryChargingStationStats() {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const snapshot = await getCountFromServer(collection(db, 'batteryChargingStations'));
        setCount(snapshot.data().count);
      } catch (err) {
        console.error('Failed to fetch battery charging station count:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchCount();
  }, []);

  return { count, loading, error };
}
