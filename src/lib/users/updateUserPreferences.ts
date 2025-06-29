import { db } from '@/src/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export const updateUserPreferences = async (
  userId: string,
  preferences: {
    preferences: {
      language?: string;
      region?: string;
      currency?: string;
    };
  }
) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, preferences);
  } catch (error) {
    console.error('❌ Failed to update user preferences:', error);
    throw error;
  }
};
