import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useUser } from '@/src/context/AuthContext';

export function useTechnicianPartners() {
  const { user } = useUser();
  const [partners, setPartners] = useState<TechnicianPartner[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const colRef = collection(db, 'technicianPartners');
      const snapshot = await getDocs(colRef);
      const data = snapshot.docs.map((docSnap) => {
        const raw = docSnap.data() as TechnicianPartner;
        return { ...raw, id: docSnap.id };
      });
      setPartners(data);
    } catch (error) {
      console.error('❌ Failed to fetch technician partners:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPartner = async (
    partner: Partial<TechnicianPartner> & {
      email?: string;
      password?: string;
    }
  ) => {
    try {
      if (!user?.uid) throw new Error('Missing creator userId');

      const now = Timestamp.now();
      let userId = partner.userId || '';

      // ✅ Chỉ tạo user nếu có đủ email và password
      if (partner.email?.trim() && partner.password?.trim()) {
        const cred = await createUserWithEmailAndPassword(
          auth,
          partner.email,
          partner.password
        );
        userId = cred.user.uid;
      }

      const newDoc = await addDoc(collection(db, 'technicianPartners'), {
        ...partner,
        userId,
        createdBy: user.uid,
        isActive: partner.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      });

      await fetchPartners();
      return newDoc.id;
    } catch (error) {
      console.error('❌ Failed to create technician partner:', error);
      throw error;
    }
  };

  const updatePartner = async (
    id: string | undefined,
    updates: Partial<Omit<TechnicianPartner, 'createdAt' | 'createdBy' | 'id'>>
  ) => {
    if (!id) {
      console.error('❌ Missing partner ID when updating');
      return;
    }

    try {
      await updateDoc(doc(db, 'technicianPartners', id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
      await fetchPartners();
    } catch (error) {
      console.error('❌ Failed to update technician partner:', error);
    }
  };

  const deletePartner = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'technicianPartners', id));
      await fetchPartners();
    } catch (error) {
      console.error('❌ Failed to delete technician partner:', error);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return {
    partners,
    loading,
    fetchPartners,
    addPartner,
    updatePartner,
    deletePartner,
  };
}
