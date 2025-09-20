// Phần Notification Flatform phát triển từ 18/09/2025

'use client';
import { createNotificationJob } from '@/src/lib/notifications/client/sendNotification';
import { Topic } from '@/src/lib/notifications/types';

export function useSendTestNotification() {
  return async (uid: string) => {
    await createNotificationJob({
      templateId: 'booking.confirmed',
      topic: 'booking' as Topic,
      audience: { type:'user', uid },
      data: { code:'BB-1234', startDate:'20/09', endDate:'22/09', total:'1.200.000đ' },
    });
  };
}

