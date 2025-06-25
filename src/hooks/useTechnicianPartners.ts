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
    partner: Omit<
      TechnicianPartner,
      'id' | 'createdAt' | 'updatedAt' | 'userId' | 'createdBy'
    > & {
      email: string;
      password: string;
    }
  ) => {
    try {
      if (!user?.uid) throw new Error('Missing creator userId');
      const now = Timestamp.now();

      // 👉 Tạo tài khoản Firebase Auth trước
      const cred = await createUserWithEmailAndPassword(auth, partner.email, partner.password);
      const newUserId = cred.user.uid;

      // 👉 Sau đó lưu hồ sơ partner
      const newDoc = await addDoc(collection(db, 'technicianPartners'), {
        ...partner,
        userId: newUserId,
        createdBy: user.uid,
        createdAt: now,
        updatedAt: now,
        isActive: true,
      });

      await fetchPartners();
      return newDoc.id;
    } catch (error) {
      console.error('❌ Failed to create technician partner:', error);
      throw error;
    }
  };

  const updatePartner = async (
    id: string,
    updates: Partial<Omit<TechnicianPartner, 'createdAt' | 'createdBy' | 'id'>>
  ) => {
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
