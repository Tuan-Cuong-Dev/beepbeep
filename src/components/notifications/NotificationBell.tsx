// Phần Notification Flatform phát triển từ 18/09/2025

'use client';
import { Bell } from 'lucide-react';
import { useUser } from '@/src/context/AuthContext';
import { useNotificationBadge } from '@/src/hooks/useNotificationBadge';

export default function NotificationBell() {
  const { user } = useUser();
  const unread = useNotificationBadge(user?.uid);
  return (
    <button className="relative p-2 rounded-lg hover:bg-gray-100" aria-label="Notifications">
      <Bell className="w-5 h-5 text-gray-700" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-[#00d289] text-white text-xs rounded-full flex items-center justify-center">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </button>
  );
}
