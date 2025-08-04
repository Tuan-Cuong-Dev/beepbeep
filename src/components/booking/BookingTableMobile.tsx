'use client';

import { useTranslation } from 'react-i18next';
import { Booking } from '@/src/lib/booking/BookingTypes';
import { Button } from '@/src/components/ui/button';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import { Truck } from 'lucide-react';

interface Props {
  bookings: Booking[];
  stationNames: Record<string, string>;
  companyNames: Record<string, string>;
  packageNames: Record<string, string>;
  userNames: Record<string, string>;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
}

export default function BookingTableMobile({
  bookings,
  stationNames,
  companyNames,
  packageNames,
  userNames,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation('common');

  if (!bookings.length) {
    return <div className="text-center text-gray-500 p-6">{t('booking_table.no_bookings')}</div>;
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      {bookings
        .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
        .map((b) => (
          <div key={b.id} className="bg-white rounded-xl shadow-md p-4 text-sm space-y-2">
            {/* Customer + Status */}
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{b.fullName}</div>
                <div className="text-gray-500 text-xs">{b.phone}</div>
                <div className="text-gray-500 text-xs">{b.idNumber}</div>
              </div>
              <span
                className="inline-block px-2 py-1 rounded-full text-white text-xs"
                style={{
                  backgroundColor:
                    b.bookingStatus === 'confirmed'
                      ? '#22c55e'
                      : b.bookingStatus === 'cancelled'
                      ? '#ef4444'
                      : b.bookingStatus === 'completed'
                      ? '#3b82f6'
                      : '#f59e0b',
                }}
              >
                {t(`booking_table.status.${b.bookingStatus ?? 'draft'}`)}
              </span>
            </div>

            {/* Vehicle Info */}
            <div>
              <div className="font-medium">{b.vehicleModel}</div>
              <div className="text-xs text-gray-600">
                VIN: {b.vin || 'N/A'} | {t('booking_table.plate')}: {b.licensePlate || 'N/A'}
              </div>
            </div>

            {/* Pricing */}
            <div className="text-xs">
              <div className="text-green-600 font-bold">{formatCurrency(b.totalAmount)}</div>
              <div>{t('booking_table.package')}: {packageNames[b.package ?? ''] || 'N/A'}</div>
              <div>{t('booking_table.deposit')}: {formatCurrency(b.deposit)}</div>
              <div>{t('booking_table.remaining')}: {formatCurrency(b.remainingBalance)}</div>
            </div>

            {/* Rental Time */}
            <div className="text-xs text-gray-600">
              {t('booking_table.rental_period')}: {safeFormatDate(b.rentalStartDate)} → {safeFormatDate(b.rentalEndDate)} ({b.rentalDays ?? 'N/A'} {t('booking_table.days')})
            </div>

            {/* Delivery Method */}
            <td className="px-3 py-3 border align-top">
                  <div className="flex items-center gap-1">
                    <Truck className="h-4 w-4 text-blue-600" />
                    {t(`booking_table.delivery_method.${b.deliveryMethod}`, { defaultValue: b.deliveryMethod })}
                  </div>
                  {b.deliveryMethod === 'Deliver to Address' && b.deliveryAddress && (
                    <div className="text-xs text-gray-600 ml-6">{b.deliveryAddress}</div>
                  )}
            </td>

            {/* Accessories */}
            <div className="text-xs text-gray-700">
              {t('booking_table.accessories')}:
              {b.helmet && <div>✔ {t('booking_table.helmet')}</div>}
              {b.charger && <div>✔ {t('booking_table.charger')}</div>}
              {b.phoneHolder && <div>✔ {t('booking_table.phone_holder')}</div>}
              {b.rearRack && <div>✔ {t('booking_table.rear_rack')}</div>}
              {b.raincoat && <div>✔ {t('booking_table.raincoat')}</div>}
              {!b.helmet && !b.charger && !b.phoneHolder && !b.rearRack && !b.raincoat && (
                <div className="italic text-gray-400">{t('booking_table.none')}</div>
              )}
            </div>

            {/* Battery Info */}
            <div className="text-xs">
              {t('booking_table.battery_info')}:
              {[b.batteryCode1, b.batteryCode2, b.batteryCode3, b.batteryCode4].filter(Boolean).length > 0 ? (
                <>
                  {b.batteryCode1 && <div>🔋 {b.batteryCode1}</div>}
                  {b.batteryCode2 && <div>🔋 {b.batteryCode2}</div>}
                  {b.batteryCode3 && <div>🔋 {b.batteryCode3}</div>}
                  {b.batteryCode4 && <div>🔋 {b.batteryCode4}</div>}
                </>
              ) : (
                <div className="italic text-gray-400">{t('booking_table.no_batteries')}</div>
              )}
            </div>

            {/* Notes */}
            <div className="text-xs text-gray-700">
              {t('booking_table.notes')}: {b.note || <span className="italic text-gray-400">{t('booking_table.no_notes')}</span>}
            </div>

            {/* Station + Company */}
            <div className="text-xs text-gray-600">
              {t('booking_table.station')}: {stationNames[b.stationId ?? ''] || 'N/A'}
              <br />
              {t('created_by')}: {companyNames[b.companyId ?? ''] || 'N/A'}
            </div>

            {/* Created Info */}
            <div className="text-xs text-gray-600">
              {t('booking_table.created_by')}: {b.userId ? userNames[b.userId] || t('booking_table.unknown_user') : t('booking_table.unknown')}
              <br />
              {t('booking_table.booked_at')}: {safeFormatDate(b.createdAt, 'dd/MM/yyyy HH:mm')}
            </div>

            {/* Comment */}
            <div className="text-xs text-gray-700">
              {t('booking_table.status_comment')}: {b.statusComment || <span className="italic text-gray-400">{t('booking_table.no_comment')}</span>}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={() => onEdit(b)}
                className="bg-[#00d289] hover:bg-green-600 text-white w-full"
              >
                {t('booking_table.update')}
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(b.id)} className="w-full">
                {t('booking_table.delete')}
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}
