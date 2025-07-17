'use client';

import { auth, provider, db, signInWithPopup } from '@/src/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { signOut, User } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

/**
 * Hook to provide auth-related actions with translated messages
 */
export const useAuthService = () => {
  const { t } = useTranslation('common');

  /**
   * Sign out the current user
   */
  const signOutUser = async () => {
    try {
      await signOut(auth);
      console.log('✅', t('auth.signout_success'));
      window.location.href = '/'; // Or use router.push('/') if using App Router
    } catch (error) {
      console.error('❌', t('auth.signout_error'), error);
    }
  };

  /**
   * Sign in with Google and create user in Firestore if not exists
   * @returns user or null
   */
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await createUserInFirestore(user);
      }

      console.log('✅', t('auth.signin_success'), user);
      return user;
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn('⚠️', t('auth.popup_closed'));
      } else {
        console.error('❌', t('auth.signin_error'), error);
      }
      return null;
    }
  };

  /**
   * Create a new user in Firestore
   */
  const createUserInFirestore = async (user: User) => {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: 'Customer',
      createdAt: serverTimestamp(),
    });
  };

  return { signInWithGoogle, signOutUser };
};
