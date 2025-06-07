// lib/invitations/staff/declineStaffInvitation.ts
import { db } from '@/src/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export const declineStaffInvitation = async (inviteId: string) => {
  await updateDoc(doc(db, 'messages', inviteId), {
    status: 'declined',
  });
};