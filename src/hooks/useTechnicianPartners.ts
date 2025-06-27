import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
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

  const createFirebaseUser = async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }) => {
    const res = await fetch('/api/createUser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });

    const contentType = res.headers.get('content-type');

    // Nếu là lỗi, thì đọc text để debug lỗi rõ ràng hơn
    if (!res.ok) {
      const errorText = contentType?.includes('application/json')
        ? (await res.json()).error
        : await res.text();

      throw new Error(errorText || 'Unknown error');
    }

    // Nếu đúng là JSON thì parse, còn không thì trả lỗi
    if (contentType?.includes('application/json')) {
      const data = await res.json();
      return data.uid;
    } else {
      throw new Error('Unexpected response format (not JSON)');
    }
  };


  const addPartner = async (
    partner: Partial<TechnicianPartner> & { email?: string; password?: string }
  ) => {
    try {
      if (!user?.uid) throw new Error('Missing creator userId');

      const now = Timestamp.now();
      const newDoc = await addDoc(collection(db, 'technicianPartners'), {
        ...partner,
        userId: '',
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
    updates: Partial<Omit<TechnicianPartner, 'createdAt' | 'createdBy' | 'id'> & { email: string; password: string }>
  ) => {
    if (!id) {
      console.error('❌ Missing partner ID when updating');
      return;
    }

    try {
      const partnerRef = doc(db, 'technicianPartners', id);
      const partnerSnap = await getDoc(partnerRef);
      const existingPartner = partnerSnap.exists() ? partnerSnap.data() as TechnicianPartner : null;

      let userId = updates.userId || existingPartner?.userId;

      if (!userId && updates.email?.trim() && updates.password?.trim()) {
        try {
          userId = await createFirebaseUser({
            email: updates.email,
            password: updates.password,
            name: updates.name ?? existingPartner?.name ?? '',
          });

          if (!userId) {
            throw new Error('Missing userId when writing to Firestore');
          }

          await setDoc(doc(db, 'users', userId), {
            email: updates.email,
            name: updates.name ?? existingPartner?.name ?? '',
            role: 'technician_partner',
            createdAt: existingPartner?.createdAt || Timestamp.now(),
            updatedAt: Timestamp.now(),
          }, { merge: true });

        } catch (err: any) {
          if (err.message.includes('email-already-in-use')) {
            alert('❌ Email đã được sử dụng cho tài khoản khác.');
          } else {
            alert('❌ Lỗi tạo tài khoản: ' + err.message);
          }
          throw err;
        }
      }

      await updateDoc(partnerRef, {
        ...updates,
        ...(userId ? { userId } : {}),
        updatedAt: Timestamp.now(),
      });

      console.log('✅ Partner updated successfully:', id);
      await fetchPartners();

    } catch (error) {
      console.error('❌ Failed to update technician partner:', error);
      throw error;
    }
  };

  const deletePartner = async (id: string, userId?: string) => {
    try {
      if (userId) {
        await setDoc(doc(db, 'users', userId), {
          role: 'customer',
          updatedAt: Timestamp.now(),
        }, { merge: true });
      }

      await deleteDoc(doc(db, 'technicianPartners', id));
      await fetchPartners();

      console.log('✅ Technician partner removed and user downgraded to customer.');
    } catch (error) {
      console.error('❌ Failed to remove partner or update user:', error);
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