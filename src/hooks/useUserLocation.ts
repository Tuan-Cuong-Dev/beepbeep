'use client';

import { useEffect, useState } from 'react';
import { Timestamp } from 'firebase/firestore';
import { getUserLocation, updateUserLocation } from '@/src/lib/users/locationService'; // bạn cần tạo file này

export interface UserLocation {
  lat: number;
  lng: number;
  address?: string;
  updatedAt: Timestamp;
}

export function useUserLocation(userId: string | null | undefined) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Lấy dữ liệu ban đầu
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchLocation = async () => {
      try {
        const loc = await getUserLocation(userId);
        setLocation(loc);
      } catch (err: any) {
        console.error('❌ Failed to fetch location:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [userId]);

  // Cập nhật vị trí người dùng
  const updateLocation = async (newLoc: Partial<UserLocation>) => {
  if (!userId) return;

  if (newLoc.lat == null || newLoc.lng == null) {
    console.error('Latitude and Longitude are required');
    return;
  }

  try {
    const updated: UserLocation = {
      lat: newLoc.lat,
      lng: newLoc.lng,
      address: newLoc.address || location?.address || '',
      updatedAt: Timestamp.now(),
    };
    await updateUserLocation(userId, updated);
    setLocation(updated);
  } catch (err: any) {
    console.error('❌ Failed to update location:', err);
    setError(err);
  }
};
  return { location, updateLocation, loading, error };
}
