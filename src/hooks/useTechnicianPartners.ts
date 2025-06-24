import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { TechnicianPartner } from '@/src/lib/technicianPartners/technicianPartnerTypes';
import { useUser } from '@/src/context/AuthContext'; // Lấy userId của technician_assistant

export function useTechnicianPartners() {
  const { user } = useUser(); // 👈 Lấy thông tin người đang đăng nhập
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
    partner: Omit<TechnicianPartner, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'createdBy'>
  ) => {
    try {
      if (!user?.uid) throw new Error('Missing creator userId');
      const now = Timestamp.now();
      const newDoc = await addDoc(collection(db, 'technicianPartners'), {
        ...partner,
        userId: '', // Để trống, sẽ gán sau khi tạo user Firebase
        createdBy: user.uid, // 👈 Ghi nhận người tạo
        createdAt: now,
        updatedAt: now,
      });
      await fetchPartners();
      return newDoc.id;
    } catch (error) {
      console.error('❌ Failed to add technician partner:', error);
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
