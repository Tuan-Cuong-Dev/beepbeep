import { db } from '@/src/firebaseConfig';
import { deleteDoc, doc } from 'firebase/firestore';

export async function deleteInvitationMessage(id: string) {
  await deleteDoc(doc(db, 'messages', id));
}
