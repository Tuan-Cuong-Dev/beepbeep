'use client';

import { useTranslation } from 'react-i18next';
import { Booking } from '@/src/lib/booking/BookingTypes';
import { Card, CardContent } from '@/src/components/ui/card';
import { formatCurrency } from '@/src/utils/formatCurrency';

interface Props {
  bookings: Booking[];
}

export default function BookingSummaryCards({ bookings }: Props) {
  const { t } = useTranslation('common', { keyPrefix: 'booking_summary_cards' });

  const totalBookings = bookings.length;
  const totalAmount = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const today = new Date();
  const todayBookings = bookings.filter((b) => {
    if (!b.createdAt) return false;
    const bookingDate = b.createdAt.toDate();
    return (
      bookingDate.getFullYear() === today.getFullYear() &&
      bookingDate.getMonth() === today.getMonth() &&
      bookingDate.getDate() === today.getDate()
    );
  }).length;

  const cancelledBookings = bookings.filter((b) => b.bookingStatus === 'cancelled').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('total_bookings')}</h3>
          <div className="text-2xl font-bold">{totalBookings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('total_revenue')}</h3>
          <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('today_bookings')}</h3>
          <div className="text-2xl font-bold">{todayBookings}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-1">{t('cancelled_bookings')}</h3>
          <div className="text-2xl font-bold">{cancelledBookings}</div>
        </CardContent>
      </Card>
    </div>
  );
}
