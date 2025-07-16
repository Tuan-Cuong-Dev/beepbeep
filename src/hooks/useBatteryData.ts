'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Battery } from '@/src/lib/batteries/batteryTypes';
import { useUser } from '@/src/context/AuthContext';

export function useBatteryData() {
  const { user, role } = useUser();
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (role?.toLowerCase() === 'admin') {
          await fetchAllBatteries();
        } else if (role?.toLowerCase() === 'company_owner') {
          await fetchBatteriesByCompanyOwner(user.uid);
        } else {
          await fetchBatteriesByStaff(user.uid);
        }
      } catch (err: any) {
        console.error('Error fetching batteries:', err);
        setError('Failed to load batteries');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.uid, role]);

  const fetchAllBatteries = async () => {
    const snapshot = await getDocs(collection(db, 'batteries'));
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Battery, 'id'>),
    }));
    setBatteries(list);
  };

  const fetchBatteriesByStaff = async (userId: string) => {
    const staffSnap = await getDocs(
      query(collection(db, 'staffs'), where('userId', '==', userId))
    );

    if (staffSnap.empty) {
      setError('No company found for this user');
      setBatteries([]);
      return;
    }

    const companyId = staffSnap.docs[0].data().companyId;
    await fetchBatteriesByCompanyId(companyId);
  };

  const fetchBatteriesByCompanyOwner = async (userId: string) => {
    const companySnap = await getDocs(
      query(collection(db, 'rentalCompanies'), where('ownerId', '==', userId))
    );

    if (companySnap.empty) {
      setError('No company found for this owner');
      setBatteries([]);
      return;
    }

    const companyId = companySnap.docs[0].id;
    await fetchBatteriesByCompanyId(companyId);
  };

  const fetchBatteriesByCompanyId = async (companyId: string) => {
    const q = query(collection(db, 'batteries'), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Battery, 'id'>),
    }));
    setBatteries(list);
  };

  return { batteries, setBatteries, loading, error };
}
