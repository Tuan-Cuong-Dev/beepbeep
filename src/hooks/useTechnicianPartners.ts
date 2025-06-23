import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';

export function useTechnicianPartners(companyId?: string) {
  const [partners, setPartners] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'technicianPartners');
      const q = companyId ? query(colRef, where('companyId', '==', companyId)) : colRef;
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        ...(doc.data() as TechnicianPartner),
        id: doc.id,
      }));
      setPartners(data);
    } catch (error) {
      console.error('Failed to fetch technician partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPartner = async (partner: Omit<TechnicianPartner, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const now = Timestamp.now();
      const newDoc = await addDoc(collection(db, 'technicianPartners'), {
        ...partner,
        createdAt: now,
        updatedAt: now,
      });
      await fetchPartners();
      return newDoc.id;
    } catch (error) {
      console.error('Failed to add technician partner:', error);
      throw error;
    }
  };

  const updatePartner = async (id: string, updates: Partial<TechnicianPartner>) => {
    try {
      await updateDoc(doc(db, 'technicianPartners', id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await fetchPartners();
    } catch (error) {
      console.error('Failed to update technician partner:', error);
    }
  };

  const deletePartner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'technicianPartners', id));
      await fetchPartners();
    } catch (error) {
      console.error('Failed to delete technician partner:', error);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [companyId]);

  return {
    partners,
    loading,
    fetchPartners,
    addPartner,
    updatePartner,
    deletePartner,
  };
}
