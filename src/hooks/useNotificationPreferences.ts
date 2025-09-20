// Phần Notification Flatform phát triển từ 18/09/2025

'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import type { UserNotificationPreferences } from '@/src/lib/notifications/types';
const defaultPref: UserNotificationPreferences = {
  uid: '',
  language: 'vi',
  channelOptIn: { inapp: true, push: true, zalo: false, viber: false, email: true, sms: false },
  topicOptIn: { booking: true, dispatch: true, commission: true, invitation: true, system: true, marketing: false },
  contact: { fcmTokens: [] },
  updatedAt: Date.now(),
};

export function useNotificationPreferences(uid?: string | null) {
  const [pref, setPref] = useState<UserNotificationPreferences | null>(null);
  const [loading, setLoading] = useState(!!uid);

  useEffect(() => {
    if (!uid) return;
    const ref = doc(db, 'userNotificationPreferences', uid);
    const unsub = onSnapshot(ref, async (snap) => {
      if (snap.exists()) setPref(snap.data() as UserNotificationPreferences);
      else {
        await setDoc(ref, { ...defaultPref, uid, updatedAt: Date.now() });
        setPref({ ...defaultPref, uid });
      }
      setLoading(false);
    });
    return () => unsub();
  }, [uid]);

  return { pref, loading };
}
