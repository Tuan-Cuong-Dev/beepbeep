// 📁 services/userLocationService.ts
// Các dịch vụ xử lý vị trí người dùng

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  GeoPoint,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import type { UserLocation } from '@/src/lib/locations/locationTypes';

/**
 * Chuẩn hoá lastKnownLocation đọc từ Firestore về dạng UserLocation
 * - Không ép buộc geo phải tồn tại (UserLocation.geo là optional)
 * - Tự sinh location string từ geo nếu chưa có
 */
function normalizeUserLocation(raw: any): UserLocation | null {
  if (!raw) return null;

  const hasGeo =
    raw.geo &&
    typeof raw.geo.latitude === 'number' &&
    typeof raw.geo.longitude === 'number';

  const geo: GeoPoint | undefined = hasGeo ? (raw.geo as GeoPoint) : undefined;

  const updatedAt: Timestamp | undefined =
    raw.updatedAt instanceof Timestamp ? (raw.updatedAt as Timestamp) : undefined;

  const locationStr: string | undefined =
    typeof raw.location === 'string'
      ? raw.location
      : geo
      ? `${geo.latitude},${geo.longitude}`
      : undefined;

  const result: UserLocation = {
    ...(geo ? { geo } : {}),
    location: locationStr,
    mapAddress: typeof raw.mapAddress === 'string' ? raw.mapAddress : undefined,
    address: typeof raw.address === 'string' ? raw.address : undefined,
    updatedAt, // có thể undefined – OK theo type
  };

  return result;
}

export async function getUserLocation(userId: string): Promise<UserLocation | null> {
  if (!userId) return null;

  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    console.warn(`⚠️ User ${userId} không tồn tại`);
    return null;
  }

  const last = snap.data()?.lastKnownLocation;
  if (!last) {
    console.warn(`⚠️ User ${userId} chưa có lastKnownLocation`);
    return null;
  }

  return normalizeUserLocation(last);
}

/**
 * Cập nhật vị trí người dùng.
 * - YÊU CẦU có geo (vì lưu xuống Firestore cần GeoPoint chuẩn để query theo bán kính)
 * - Nếu thiếu location string, tự sinh từ geo
 */
export async function updateUserLocation(userId: string, location: UserLocation) {
  if (!userId) throw new Error('updateUserLocation: userId required');
  if (!location?.geo)
    throw new Error('updateUserLocation: geo (GeoPoint) is required');

  const ref = doc(db, 'users', userId);

  const locationStr =
    typeof location.location === 'string' && location.location.trim().length > 0
      ? location.location
      : `${location.geo.latitude},${location.geo.longitude}`;

  await updateDoc(ref, {
    lastKnownLocation: {
      geo: location.geo,
      location: locationStr,
      mapAddress: location.mapAddress ?? '',
      address: location.address ?? '',
      updatedAt: serverTimestamp(), // luôn dùng server time cho chuẩn
    },
  });
}
