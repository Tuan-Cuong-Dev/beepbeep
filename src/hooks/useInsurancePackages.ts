import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { InsurancePackage } from '@/src/lib/insurancePackages/insurancePackageTypes';
import { generateRandomCode } from '@/src/utils/generateRandomCode';

export function useInsurancePackages() {
  const [packages, setPackages] = useState<InsurancePackage[]>([]);
  const [loading, setLoading] = useState(true);

  const ref = collection(db, 'insurancePackages');

  // 🔄 Fetch all packages
  const fetchAll = async () => {
    setLoading(true);
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InsurancePackage[];
    setPackages(data);
    setLoading(false);
  };

  // ➕ Create new package
  const create = async (userId: string): Promise<InsurancePackage> => {
    const now = Timestamp.now();
    const newPackage: Omit<InsurancePackage, 'id'> = {
      userId,
      packageCode: `BIP365-${generateRandomCode(4)}-${generateRandomCode(4)}-${generateRandomCode(4)}`,
      isActive: false,
      activationMethod: 'manual',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(ref, newPackage);
    const created = { id: docRef.id, ...newPackage };
    setPackages((prev) => [created, ...prev]);
    return created;
  };

  // ❌ Delete a package
  const remove = async (id: string) => {
    await deleteDoc(doc(ref, id));
    setPackages((prev) => prev.filter((p) => p.id !== id));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return {
    packages,
    loading,
    fetchAll,
    create,
    remove,
  };
}
