import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { UserLocation } from '@/src/hooks/useUserLocation';

export async function getUserLocation(userId: string): Promise<UserLocation | null> {
  const ref = doc(db, 'users', userId);
  const snap = await getDoc(ref);
  const data = snap.data();
  if (!data?.lastKnownLocation) {
    console.warn(`⚠️ User ${userId} chưa có lastKnownLocation`);
    return null;
  }
  return data.lastKnownLocation as UserLocation;
}

export async function updateUserLocation(userId: string, location: UserLocation) {
  const ref = doc(db, 'users', userId);
  await updateDoc(ref, {
    lastKnownLocation: location,
  });
}
