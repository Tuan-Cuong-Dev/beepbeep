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
  getDoc,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { InsuranceProduct } from '@/src/lib/insuranceProducts/insuranceProductTypes';

// ✅ Hook chính cho danh sách sản phẩm bảo hiểm
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
  const update = async (
    id: string,
    data: Partial<Omit<InsuranceProduct, 'id' | 'createdAt' | 'updatedAt'>>
  ) => {
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

// ✅ Hook phụ: lấy thông tin chi tiết 1 sản phẩm theo ID
export function useInsuranceProductById(id?: string) {
  const [product, setProduct] = useState<InsuranceProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'insuranceProducts', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as InsuranceProduct);
        } else {
          setProduct(null);
        }
      } catch (err) {
        console.error('Error fetching product by id:', err);
        setProduct(null);
      }
      setLoading(false);
    };

    fetch();
  }, [id]);

  return { product, loading };
}
