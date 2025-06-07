import { db } from '@/src/firebaseConfig';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Battery } from '@/src/lib/batteries/batteryTypes';

export async function checkBatteryCode(code: string): Promise<Battery | null> {
  const q = query(collection(db, 'batteries'), where('batteryCode', '==', code));
  const snap = await getDocs(q);

  if (!snap.empty) {
    const battery = snap.docs[0].data() as Battery;
    return battery;
  }
  return null;
}
