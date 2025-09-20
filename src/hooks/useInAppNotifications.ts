// Phần Notification Flatform phát triển từ 18/09/2025

'use client';

import { useEffect, useState } from 'react';
import { db } from '@/src/firebaseConfig';
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import type { InAppNotification } from '@/src/lib/notifications/types';

export function useInAppNotifications(uid?: string | null, take = 30) {
  const [items, setItems] = useState<InAppNotification[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, 'user_notifications', uid, 'items'),
      orderBy('createdAt','desc'),
      limit(take)
    );
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as InAppNotification[];
      setItems(list);
      setUnread(list.filter(x=>!x.read).length);
    });
  }, [uid, take]);

  return { items, unread };
}
