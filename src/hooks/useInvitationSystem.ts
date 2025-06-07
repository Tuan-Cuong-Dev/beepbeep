// Quản lý các lời mời từ nhân sự
// hooks/useInvitationSystem.ts

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  Timestamp
} from 'firebase/firestore';

export interface Invitation {
  id?: string;
  userId: string;
  companyId: string;
  stationId?: string;
  role: 'support' | 'technician' | 'station_manager' | 'company_admin';
  status: 'pending' | 'accepted' | 'rejected';
  content: string;
  createdAt: Timestamp;
}

export function useInvitations(userId: string | null) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvitations = async () => {
    if (!userId) return;
    setLoading(true);
    const q = query(collection(db, 'messages'), where('userId', '==', userId), where('type', '==', 'invitation'));
    const snap = await getDocs(q);
    const list: Invitation[] = snap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Invitation) }));
    setInvitations(list);
    setLoading(false);
    console.log('[Invitations]', list);
  };

  const acceptInvitation = async (invitation: Invitation) => {
    if (!invitation.id) return;
    // 1. Cập nhật status của invitation
    await updateDoc(doc(db, 'messages', invitation.id), { status: 'accepted' });
    // 2. Tạo staff document
    await addDoc(collection(db, 'staffs'), {
      userId: invitation.userId,
      companyId: invitation.companyId,
      stationId: invitation.stationId || '',
      role: invitation.role,
      name: '',
      email: '',
      phone: '',
      accepted: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    await fetchInvitations();
  };

  const rejectInvitation = async (invitationId: string) => {
    await updateDoc(doc(db, 'messages', invitationId), { status: 'rejected' });
    await fetchInvitations();
  };

  useEffect(() => {
    fetchInvitations();
  }, [userId]);

  return {
    invitations,
    loading,
    acceptInvitation,
    rejectInvitation,
    refetchInvitations: fetchInvitations // 👈 expose để gọi lại ngoài
  };
}