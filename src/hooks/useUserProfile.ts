'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useAuth } from '@/src/components/users/useAuth';
import { User } from '@/src/lib/users/userTypes'; // đảm bảo đường dẫn đúng

export function useUserProfile() {
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile
  const fetchUserProfile = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);

    try {
      const ref = doc(db, 'users', currentUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setUser(snap.data() as User);
      }
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch user profile.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Update profile
  const updateUserProfile = useCallback(
    async (updatedFields: Partial<User>) => {
      if (!currentUser) return;

      try {
        const ref = doc(db, 'users', currentUser.uid);
        await updateDoc(ref, {
          ...updatedFields,
          updatedAt: new Date(),
        });
        await fetchUserProfile(); // Reload after update
      } catch (err: any) {
        console.error(err);
        setError('Failed to update user profile.');
      }
    },
    [currentUser, fetchUserProfile]
  );

  useEffect(() => {
    if (currentUser) {
      fetchUserProfile();
    }
  }, [currentUser, fetchUserProfile]);

  return {
    user,
    loading,
    error,
    refresh: fetchUserProfile,
    update: updateUserProfile,
  };
}
