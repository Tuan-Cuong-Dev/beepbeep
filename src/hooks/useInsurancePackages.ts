// hooks/useInsurancePackages.ts
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext';
import { InsurancePackage } from '@/src/lib/insurancePackages/insurancePackageTypes';
import { generateRandomCode } from '@/src/utils/generateRandomCode';

export function useInsurancePackages() {
  const { user } = useUser();
  const [packages, setPackages] = useState<InsurancePackage[]>([]);
  const [loading, setLoading] = useState(true);

  const ref = collection(db, 'insurancePackages');

  // 🔄 Fetch packages for current user
  const fetchAll = async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      const q = query(
        ref,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as InsurancePackage[];
      setPackages(data);
    } catch (err) {
      console.error('❌ Failed to fetch insurance packages:', err);
    } finally {
      setLoading(false);
    }
  };

  // ➕ Create new insurance package
  const create = async ({
    userId,
    productId,
    vehicleId,
    frameNumber,
    engineNumber,
    plateNumber,
    imageUrl,
    note,
  }: {
    userId: string;
    productId: string;
    vehicleId: string;
    frameNumber?: string;
    engineNumber?: string;
    plateNumber?: string;
    imageUrl?: string;
    note?: string;
  }): Promise<InsurancePackage> => {
    const now = Timestamp.now();

    const newPackage: Omit<InsurancePackage, 'id'> = {
      userId,
      productId,
      vehicleId,
      packageCode: `BIP365-${generateRandomCode(4)}-${generateRandomCode(4)}-${generateRandomCode(4)}`,
      frameNumber,
      engineNumber,
      plateNumber,
      imageUrl,
      isActive: true,
      activationMethod: 'manual',
      createdAt: now,
      updatedAt: now,
      note,
    };

    const docRef = await addDoc(ref, newPackage);
    const created = { id: docRef.id, ...newPackage };
    setPackages((prev) => [created, ...prev]);
    return created;
  };

  // 🧾 Extend package
  const extend = async (id: string, additionalDays: number) => {
    const packageRef = doc(db, 'insurancePackages', id);
    const snap = await getDoc(packageRef);
    if (!snap.exists()) return;

    const data = snap.data() as InsurancePackage;
    const oldDate = data.expiredAt?.toDate?.() || new Date();

    const newDate = new Date(oldDate);
    newDate.setDate(newDate.getDate() + additionalDays);

    await updateDoc(packageRef, {
      expiredAt: Timestamp.fromDate(newDate),
      updatedAt: Timestamp.now(),
    });

    await fetchAll(); // Refresh list
  };

  // ❌ Remove package
  const remove = async (id: string) => {
    await deleteDoc(doc(ref, id));
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    fetchAll();
  }, [user?.uid]);

  return {
    packages,
    loading,
    fetchAll,
    create,
    remove,
    extend,
  };
}
