// hooks/useUserLocation.ts
// Chuẩn hóa dựa vào types mới định nghĩa : locationType.ts ngày 22/08/2025.

'use client';
import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { doc, onSnapshot, updateDoc, serverTimestamp, GeoPoint, Timestamp } from 'firebase/firestore';
import type { UserLocation as AppUserLocation } from '@/src/lib/users/userTypes';

export function useUserLocation(uid: string) {
  const [location, setLocation] = useState<AppUserLocation | null>(null);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'users', uid);
    return onSnapshot(ref, (snap) => {
      const data = snap.data();
      const last = data?.lastKnownLocation;

      // Chuẩn mới
      if (last?.geo instanceof GeoPoint) {
        setLocation({
          geo: last.geo,
          address: last.address ?? '',
          updatedAt: last.updatedAt ?? Timestamp.now(),
          location: last.location ?? `${last.geo.latitude},${last.geo.longitude}`,
        });
        return;
      }

      // Dữ liệu cũ (lat/lng rời) -> migrate tạm vào state
      if (typeof last?.lat === 'number' && typeof last?.lng === 'number') {
        const gp = new GeoPoint(last.lat, last.lng);
        setLocation({
          geo: gp,
          address: last.address ?? '',
          updatedAt: last.updatedAt ?? Timestamp.now(),
          location: `${gp.latitude},${gp.longitude}`,
        });
        return;
      }

      setLocation(null);
    });
  }, [uid]);

  const updateLocation = async (input: { lat: number; lng: number; address?: string }) => {
    if (!uid) return;
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, {
      lastKnownLocation: {
        geo: new GeoPoint(input.lat, input.lng),
        location: `${input.lat},${input.lng}`,
        address: input.address ?? '',
        updatedAt: serverTimestamp(),
      },
    });
  };

  return { location, updateLocation };
}
