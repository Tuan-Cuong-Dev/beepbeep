import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Staff } from '@/src/lib/staff/staffTypes';

export function useAvailableTechnicians() {
  const [technicians, setTechnicians] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTechnicians = async () => {
      setLoading(true);
      const q = query(collection(db, 'staffs'), where('role', '==', 'technician'));
      const snap = await getDocs(q);
      const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Staff));
      setTechnicians(data);
      setLoading(false);
    };

    fetchTechnicians();
  }, []);

  return { technicians, loading };
}
