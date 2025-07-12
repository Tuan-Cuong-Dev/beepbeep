// Dành riêng cho Admin và Công ty Bíp Bíp tạo

'use client';

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { InsuranceProduct } from '@/src/lib/insuranceProducts/insuranceProductTypes';

export function useInsuranceProducts() {
  const [products, setProducts] = useState<InsuranceProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const ref = collection(db, 'insuranceProducts');

  // 🔄 Fetch all products
  const fetchAll = async () => {
    setLoading(true);
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as InsuranceProduct[];
    setProducts(data);
    setLoading(false);
  };

  // ➕ Create new product
  const create = async (data: Omit<InsuranceProduct, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Timestamp.now();
    const newData = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    const docRef = await addDoc(ref, newData);
    const created = { id: docRef.id, ...newData };
    setProducts((prev) => [created, ...prev]);
  };

  // 📝 Update existing product
const update = async (id: string, data: Partial<Omit<InsuranceProduct, 'id' | 'createdAt' | 'updatedAt'>>) => {
  const docRef = doc(ref, id);
  const updatedData = {
    ...data,
    updatedAt: Timestamp.now(),
  };
  await updateDoc(docRef, updatedData);
  await fetchAll(); // Refresh state
};


  // ❌ Delete
  const remove = async (id: string) => {
    await deleteDoc(doc(ref, id));
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  // Auto fetch on mount
  useEffect(() => {
    fetchAll();
  }, []);

  return {
    products,
    loading,
    create,
    update,
    remove,
    fetchAll,
  };
}
