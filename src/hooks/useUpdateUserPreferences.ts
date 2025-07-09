'use client';

import { useState } from 'react';
import { updateUserPreferences } from '@/src/lib/users/updateUserPreferences';

interface PreferencesPayload {
  language?: string;
  region?: string;
  currency?: string;
}

export function useUpdateUserPreferences(userId: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updatePreferences = async (prefs: PreferencesPayload) => {
    if (!userId) {
      setError(new Error('User ID is missing'));
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
     await updateUserPreferences(userId, {
      preferences: {
        ...prefs, // ✅ đảm bảo đúng shape mong muốn
      },
    });
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Failed to update preferences:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    updatePreferences,
    loading,
    success,
    error,
  };
}
