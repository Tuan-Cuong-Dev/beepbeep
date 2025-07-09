'use client';

import { useEffect, useState } from 'react';
import { getUserPreferences, UserPreferences } from '@/src/lib/users/getUserPreferences';
import { updateUserPreferences } from '@/src/lib/users/updateUserPreferences';

export function useUserPreferences(userId: string | null | undefined) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'en',
    region: 'US',
    currency: 'USD',
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        const prefs = await getUserPreferences(userId);
        setPreferences(prefs);
      } catch (err: any) {
        console.error('❌ Failed to fetch preferences:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [userId]);

  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!userId) return;

    try {
      const updated = { ...preferences, ...newPrefs };

      // ✅ Truyền đúng định dạng vào updateUserPreferences
      await updateUserPreferences(userId, { preferences: updated });

      setPreferences(updated);
    } catch (err: any) {
      console.error('❌ Failed to update preferences:', err);
      setError(err);
    }
  };

  return { preferences, loading, error, updatePreferences };
}
