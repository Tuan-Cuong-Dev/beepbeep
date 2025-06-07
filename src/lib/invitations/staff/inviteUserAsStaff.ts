import { db } from '@/src/firebaseConfig';
import { doc, setDoc, Timestamp, collection } from 'firebase/firestore';

export const inviteUserAsStaff = async (
  email: string,
  companyId: string,
  role: string,
  stationId: string,
  content: string,
  userId: string,
  name: string,
  phone: string
) => {
  const newInvitation = {
    userId,
    email,
    name,
    phone,
    companyId,
    stationId,
    role,
    type: 'invitation',
    content,
    status: 'pending',
    createdAt: Timestamp.now(),
  };
  await setDoc(doc(collection(db, 'messages')), newInvitation);
};