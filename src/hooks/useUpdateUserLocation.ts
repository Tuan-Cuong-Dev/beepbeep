'use client';

import { useState } from 'react';
import { updateUserLocation } from '@/src/lib/locations/locationService';
import { Timestamp } from 'firebase/firestore';

interface LocationPayload {
  lat: number;
  lng: number;
  address?: string;
  updatedAt?: Timestamp; // optional, tự động thêm nếu không có
}

export function useUpdateUserLocation(userId: string | null | undefined) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateLocation = async (location: LocationPayload) => {
    if (!userId) {
      setError(new Error('User ID is missing'));
      return;
    }

    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const payload = {
        ...location,
        updatedAt: location.updatedAt ?? Timestamp.now(),
      };

      await updateUserLocation(userId, payload);
      setSuccess(true);
    } catch (err: any) {
      console.error('❌ Failed to update location:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return {
    updateLocation,
    loading,
    success,
    error,
  };
}
