// lib/live-location/updateUserLiveLocation.ts
// Kiểm soát các đối tượng thường xuyên di chuyển của hệ thống

import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { BUSINESS_TYPE_LABELS, BusinessType } from '@/src/lib/my-business/businessTypes';

type UpdateLiveLocationInput = {
  uid: string;
  displayName?: string | null;
  businessType: BusinessType;
  companyId?: string | null;
  entityId?: string | null; // id xe, tuyến, v.v... nếu có
  coords: { lat: number; lng: number };
  accuracy?: number | null;
  heading?: number | null;
  speed?: number | null;
  ttlMinutes?: number; // mặc định 15'
};

export async function updateUserLiveLocation(input: UpdateLiveLocationInput) {
  const {
    uid,
    displayName,
    businessType,
    companyId,
    entityId,
    coords,
    accuracy,
    heading,
    speed,
    ttlMinutes = 15,
  } = input;

  if (!uid) return;

  const expiresAt = Timestamp.fromDate(
    new Date(Date.now() + ttlMinutes * 60 * 1000)
  );

  const ref = doc(db, 'liveLocations', uid);
  await setDoc(
    ref,
    {
      uid,
      displayName: displayName ?? null,
      businessType,                                // kiểm soát bằng union BusinessType
      businessTypeLabel: BUSINESS_TYPE_LABELS[businessType],
      companyId: companyId ?? null,
      entityId: entityId ?? null,
      coordinates: { lat: coords.lat, lng: coords.lng },
      accuracy: accuracy ?? null,
      heading: heading ?? null,
      speed: speed ?? null,
      source: 'web',
      updatedAt: serverTimestamp(),
      expiresAt,
      isActive: true,
    },
    { merge: true }
  );
}
