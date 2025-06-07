// 📁 lib/users/userService.ts
import { db } from '@/src/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { User } from '@/src/lib/users/userTypes';

export const updateUser = async (userId: string, data: Partial<User>) => {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, data);
};

export async function getUserNameById(userId: string): Promise<string> {
  try {
    const docRef = doc(db, 'users', userId);
    const snapshot = await getDoc(docRef);
    const data = snapshot.data();
    return data?.name || 'Unknown';
  } catch {
    return 'Unknown';
  }
}