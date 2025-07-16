'use client';

import { useEffect, useState } from 'react';
import { getUserPreferences, UserPreferences } from '@/src/lib/users/getUserPreferences';
import { updateUserPreferences } from '@/src/lib/users/updateUserPreferences';

export function usePreferences(userId: string | null | undefined) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    language: 'vi',
    region: 'VN',
    currency: 'VND',
  });

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load once when userId changes
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPreferences = async () => {
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

    fetchPreferences();
  }, [userId]);

  // Update preferences
  const updatePreferences = async (newPrefs: Partial<UserPreferences>) => {
    if (!userId) {
      setError(new Error('User ID is missing'));
      return;
    }

    setUpdating(true);
    setSuccess(false);
    setError(null);

    try {
      const mergedPrefs = { ...preferences, ...newPrefs };
      await updateUserPreferences(userId, {
        preferences: mergedPrefs,
      });
      setPreferences(mergedPrefs);
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Failed to update preferences:', err);
      setError(err);
    } finally {
      setUpdating(false);
    }
  };

  return {
    preferences,
    updatePreferences,
    loading,
    updating,
    success,
    error,
  };
}
