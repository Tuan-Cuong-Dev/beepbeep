import { db } from '@/src/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export interface UserPreferences {
  language: string;
  region: string;
  currency?: string;
}

export const getUserPreferences = async (
  userId: string
): Promise<UserPreferences> => {
  const userRef = doc(db, 'users', userId);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    throw new Error('User not found');
  }

  const data = snap.data();
  const prefs = data.preferences || {};

  return {
    language: prefs.language || 'en',
    region: prefs.region || 'US',
    currency: prefs.currency || 'USD',
  };
};
