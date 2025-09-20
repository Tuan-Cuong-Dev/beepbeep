// Phần Notification Flatform phát triển từ 18/09/2025

'use client';

import { useUser } from '@/src/context/AuthContext';
import { useInAppNotifications } from '@/src/hooks/useInAppNotifications';
import { Button } from '@/src/components/ui/button';
import { db } from '@/src/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';

export default function NotificationCenter() {
  const { user } = useUser();
  const { items } = useInAppNotifications(user?.uid, 50);

  const markRead = async (id: string) => {
    if (!user?.uid) return;
    await updateDoc(doc(db, 'user_notifications', user.uid, 'items', id), { read: true, readAt: Date.now() });
  };

  const markAllRead = async () => {
    if (!user?.uid) return;
    // NOTE: có thể batch/write ở server (CF callable) cho nhanh; client ở đây demo
    await Promise.all(items.filter(i=>!i.read).map(i => 
      updateDoc(doc(db, 'user_notifications', user.uid!, 'items', i.id), { read: true, readAt: Date.now() })
    ));
  };

  return (
    <div className="bg-white rounded-xl shadow p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Thông báo</h3>
        <Button variant="ghost" onClick={markAllRead}>Đánh dấu đã đọc hết</Button>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-500 text-sm">Chưa có thông báo.</p>
        ) : items.map(n => (
          <div key={n.id} className={`p-3 rounded-lg border ${n.read ? 'bg-white' : 'bg-gray-50'}`}>
            <div className="text-xs text-gray-400 mb-1">[{n.topic}]</div>
            <div className="text-sm font-medium text-gray-800">{n.title}</div>
            <div className="text-sm text-gray-700">{n.body}</div>
            <div className="mt-2 flex gap-2">
              {!n.read && <Button size="sm" onClick={()=>markRead(n.id)}>Đánh dấu đã đọc</Button>}
              {n.actionUrl && <a className="text-[#00d289] text-sm" href={n.actionUrl}>Mở</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
