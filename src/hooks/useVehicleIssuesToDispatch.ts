import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { ExtendedVehicleIssue } from '@/src/lib/vehicleIssues/vehicleIssueTypes';

export function useVehicleIssuesToDispatch() {
  const [issues, setIssues] = useState<ExtendedVehicleIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      const q = query(
        collection(db, 'vehicleIssues'),
        where('status', '==', 'pending'),
        where('assignedTo', '==', null)
      );
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ExtendedVehicleIssue));
      setIssues(data);
      setLoading(false);
    };

    fetchIssues();
  }, []);

  return { issues, loading };
}