'use client';

import { useState, useEffect } from 'react';
import { db } from '@/src/firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  doc, 
  query, 
  where, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { SubscriptionPackage } from '@/src/lib/subscriptionPackages/subscriptionPackagesType';

export function useSubscriptionPackageData(companyId: string) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      let q;
      if (companyId) {
        q = query(collection(db, 'subscriptionPackages'), where('companyId', '==', companyId));
      } else {
        q = collection(db, 'subscriptionPackages');
      }

      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<SubscriptionPackage, 'id'>),
      }));
      setPackages(data);
    } catch (err) {
      console.error('❌ Failed to fetch subscription packages:', err);
      setError('Failed to load packages.');
    } finally {
      setLoading(false);
    }
  };

  const createPackage = async (pkg: Omit<SubscriptionPackage, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newDoc = {
        ...pkg,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'subscriptionPackages'), newDoc);

      setPackages(prev => [
        ...prev,
        {
          ...pkg,
          id: docRef.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        },
      ]);
    } catch (err) {
      console.error('❌ Failed to create subscription package:', err);
      setError('Failed to create package.');
    }
  };

  const updatePackage = async (id: string, pkg: Partial<SubscriptionPackage>) => {
    try {
      const docRef = doc(db, 'subscriptionPackages', id);
      await updateDoc(docRef, {
        ...pkg,
        updatedAt: serverTimestamp(),
      });
      setPackages(prev =>
        prev.map(p => (p.id === id ? { ...p, ...pkg, updatedAt: Timestamp.now() } : p))
      );
    } catch (err) {
      console.error('❌ Failed to update subscription package:', err);
      setError('Failed to update package.');
    }
  };

  const deletePackage = async (id: string) => {
    try {
      const docRef = doc(db, 'subscriptionPackages', id);
      await deleteDoc(docRef);
      setPackages(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('❌ Failed to delete subscription package:', err);
      setError('Failed to delete package.');
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [companyId]);

  return {
    packages,
    loading,
    error,
    fetchPackages,
    createPackage,
    updatePackage,
    deletePackage,
  };
}
