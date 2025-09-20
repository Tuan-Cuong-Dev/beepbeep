// Phần Notification Flatform phát triển từ 18/09/2025

'use client';
import { useInAppNotifications } from './useInAppNotifications';
export function useNotificationBadge(uid?: string | null) {
  const { unread } = useInAppNotifications(uid, 10);
  return unread;
}
