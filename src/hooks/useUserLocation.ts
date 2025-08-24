// hooks/useUserLocation.ts
// Chuẩn hóa dựa vào types mới (LocationCore) – 24/08/2025

'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import {
  doc,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import type { LocationCore } from '@/src/lib/locations/locationTypes';

export function useUserLocation(uid: string) {
  const [location, setLocation] = useState<LocationCore | null>(null);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'users', uid);

    return onSnapshot(ref, (snap) => {
      const data = snap.data();
      const last = data?.lastKnownLocation;

      // ✅ Chuẩn mới: lastKnownLocation.geo là GeoPoint
      if (last?.geo instanceof GeoPoint) {
        const gp: GeoPoint = last.geo;
        setLocation({
          geo: gp,
          address: last.address ?? '',
          mapAddress: last.mapAddress ?? undefined,
          location: typeof last.location === 'string' && last.location.trim()
            ? last.location
            : `${gp.latitude},${gp.longitude}`,
          updatedAt: last.updatedAt ?? Timestamp.now(),
        });
        return;
      }

      // ♻️ Legacy: lat/lng rời → dựng tạm LocationCore trong state
      if (typeof last?.lat === 'number' && typeof last?.lng === 'number') {
        const gp = new GeoPoint(last.lat, last.lng);
        setLocation({
          geo: gp,
          address: last.address ?? '',
          location: `${gp.latitude},${gp.longitude}`,
          updatedAt: last.updatedAt ?? Timestamp.now(),
        });
        return;
      }

      setLocation(null);
    });
  }, [uid]);

  /**
   * Cập nhật vị trí theo chuẩn LocationCore.
   * Truyền vào lat/lng và optional address/mapAddress.
   */
  const updateLocation = async (input: {
    lat: number;
    lng: number;
    address?: string;
    mapAddress?: string;
  }) => {
    if (!uid) return;
    const ref = doc(db, 'users', uid);
    const { lat, lng, address, mapAddress } = input;

    await updateDoc(ref, {
      lastKnownLocation: {
        geo: new GeoPoint(lat, lng),
        location: `${lat},${lng}`,
        ...(address ? { address } : {}),
        ...(mapAddress ? { mapAddress } : {}),
        updatedAt: serverTimestamp(),
      } as LocationCore,
    });
  };

  return { location, updateLocation };
}
