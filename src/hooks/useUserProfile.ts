// src/hooks/useUserProfile.ts
'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { useUser } from '@/src/context/AuthContext'; // ✅ dùng cùng context
import { User } from '@/src/lib/users/userTypes';

export function useUserProfile() {
  const { user: authUser } = useUser(); // ✅
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserProfile = useCallback(async () => {
    if (!authUser?.uid) { setLoading(false); return; } // ✅ không treo loading
    setLoading(true);
    setError(null);
    try {
      const ref = doc(db, 'users', authUser.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUser(snap.data() as User);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user profile.');
    } finally {
      setLoading(false);
    }
  }, [authUser?.uid]);

  const updateUserProfile = useCallback(async (updatedFields: Partial<User>) => {
    if (!authUser?.uid) return;
    try {
      const ref = doc(db, 'users', authUser.uid);
      await updateDoc(ref, { ...updatedFields, updatedAt: new Date() });
      await fetchUserProfile();
    } catch (err) {
      console.error(err);
      setError('Failed to update user profile.');
    }
  }, [authUser?.uid, fetchUserProfile]);

  useEffect(() => { fetchUserProfile(); }, [fetchUserProfile]);

  return { user, loading, error, refresh: fetchUserProfile, update: updateUserProfile };
}
