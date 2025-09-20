import { NotificationTemplate } from './types';

export const TEMPLATES: Record<string, NotificationTemplate> = {
  'booking.confirmed': {
    id: 'booking.confirmed',
    version: 1,
    title: {
      vi: 'Đơn {{code}} đã xác nhận',
      en: 'Booking {{code}} confirmed',
      ja: '予約{{code}}が確定しました',
      ko: '예약 {{code}} 확인됨',
    },
    body: {
      vi: 'Bạn thuê xe từ {{startDate}} đến {{endDate}}. Tổng: {{total}}.',
      en: 'You rent from {{startDate}} to {{endDate}}. Total: {{total}}.',
      ja: '{{startDate}}から{{endDate}}まで。合計: {{total}}。',
      ko: '{{startDate}}부터 {{endDate}}까지. 합계: {{total}}.',
    },
    channels: ['inapp','push'],
    variables: ['code','startDate','endDate','total'],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  // thêm dần...
};
