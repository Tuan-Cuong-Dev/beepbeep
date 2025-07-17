'use client';

import {
  auth,
  db,
  signInWithEmailAndPassword,
  doc,
  getDoc,
  setDoc
} from '@/src/firebaseConfig';

import { User } from 'firebase/auth';
import { serverTimestamp } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

/**
 * Custom hook to handle email/password login
 */
export const useEmailLogin = () => {
  const { t } = useTranslation('common');

  /**
   * Sign in using email and password
   * @param email - Email address
   * @param password - Plain text password
   * @returns user or null
   */
  const handleEmailLogin = async (
    email: string,
    password: string
  ): Promise<User | null> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          provider: 'email',
          createdAt: serverTimestamp(),
        });
      }

      console.log('✅', t('handle_email_login.success'), user.email);
      return user;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.error('❌', t('handle_email_login.email_not_found'));
      } else if (error.code === 'auth/wrong-password') {
        console.error('❌', t('handle_email_login.wrong_password'));
      } else {
        console.error('❌', t('handle_email_login.error'), error.message);
      }
      return null;
    }
  };

  return { handleEmailLogin };
};
