// Phần Notification Flatform phát triển từ 18/09/2025

'use client';

import { Bell, AlertTriangle, CalendarCheck, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/src/lib/utils';

export type NotificationType =
  | 'notification'
  | 'system_alert'
  | 'booking_update'
  | 'invitation';

export interface NotificationItemProps {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl?: string;
  createdAt?: Date | null;
  read?: boolean;
  onClick?: (id: string) => void; // Mark read
}

export default function NotificationItem({
  id,
  type,
  title,
  body,
  actionUrl,
  createdAt,
  read = false,
  onClick,
}: NotificationItemProps) {
  const renderIcon = () => {
    switch (type) {
      case 'system_alert':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'booking_update':
        return <CalendarCheck className="w-5 h-5 text-blue-500" />;
      case 'invitation':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div
      onClick={() => onClick?.(id)}
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-sm cursor-pointer transition hover:bg-gray-50',
        !read && 'bg-green-50 border-green-200'
      )}
    >
      <div className="flex-shrink-0 mt-1">{renderIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4
            className={cn(
              'text-sm font-semibold',
              !read ? 'text-gray-900' : 'text-gray-600'
            )}
          >
            {title}
          </h4>
          {createdAt && (
            <span className="text-xs text-gray-400 ml-2">
              {createdAt.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-sm text-gray-700 mt-1 line-clamp-2">{body}</p>

        {actionUrl && (
          <Link
            href={actionUrl}
            className="mt-2 inline-block text-xs font-medium text-[#00d289] hover:underline"
          >
            Xem chi tiết
          </Link>
        )}
      </div>
    </div>
  );
}
