import { useEffect, useState } from 'react';
import { Staff } from '@/src/lib/staff/staffTypes';
import {
  updateStaff,
  deleteStaff,
} from '@/src/lib/services/staff/staffService';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';

interface Options {
  role?: string;
  companyId?: string;
}

export function useStaffData(options?: Options) {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedRole = options?.role?.toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isTechnicianAssistant = normalizedRole === 'technician_assistant';
  const companyId = options?.companyId;

  useEffect(() => {
    if (!isAdmin && !isTechnicianAssistant && !companyId) {
      setStaffs([]);
      setLoading(false);
      return;
    }

    let q;
    if (isAdmin) {
      q = query(collection(db, 'staffs')); // Admin: tất cả
    } else if (isTechnicianAssistant) {
      q = query(collection(db, 'staffs'), where('role', '==', 'technician')); // Tech Assistant: chỉ technician
    } else {
      q = query(collection(db, 'staffs'), where('companyId', '==', companyId!)); // Các role khác: theo công ty
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const updatedStaffs: Staff[] = snapshot.docs.map((doc) => ({
          ...(doc.data() as Staff),
          id: doc.id,
        }));
        setStaffs(updatedStaffs);
        setLoading(false);
      },
      (error) => {
        console.error('Realtime fetch staff error:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin, isTechnicianAssistant, companyId]);

  const handleCreate = async () => {
    console.warn('handleCreate is disabled. Staffs should be invited via invitation flow.');
  };

  const handleUpdate = async (id: string, data: Partial<Staff>) => {
    try {
      await updateStaff(id, data);
    } catch (error) {
      console.error('Failed to update staff:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStaff(id);
    } catch (error) {
      console.error('Failed to delete staff:', error);
    }
  };

  return {
    staffs,
    loading,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
