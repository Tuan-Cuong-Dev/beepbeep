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
  /** Tuỳ chọn: truyền vào để hiện nút Sửa/Xoá */
  onEdit?: (booking: Booking) => void;
  onDelete?: (id: string) => void;
  /** Ưu tiên: ép hiện/ẩn cột thao tác. Mặc định: hiện nếu có onEdit hoặc onDelete */
  showActions?: boolean;
}

export default function BookingTable({
  bookings,
  stationNames,
  companyNames,
  packageNames,
  userNames,
  onEdit,
  onDelete,
  showActions,
}: Props) {
  const { t } = useTranslation('common');

  const actionsVisible = typeof showActions === 'boolean' ? showActions : !!onEdit || !!onDelete;

  if (!bookings.length) {
    return (
      <div className="text-center text-gray-500 p-8">
        {t('booking_table.no_bookings')}
      </div>
    );
  }

  const createdSecs = (b: Booking) =>
    typeof (b as any)?.createdAt?.seconds === 'number' ? (b as any).createdAt.seconds : 0;

  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto mt-6">
      <table className="min-w-full text-sm border border-gray-200">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 border min-w-[120px]">{t('booking_table.customer')}</th>
            <th className="px-3 py-2 border min-w-[190px]">{t('booking_table.vehicle_info')}</th>
            <th className="px-3 py-2 border min-w-[160px]">{t('booking_table.pricing')}</th>
            <th className="px-3 py-2 border">{t('booking_table.rental_period')}</th>
            <th className="px-3 py-2 border min-w-[160px]">{t('booking_table.rental_method')}</th>
            <th className="px-3 py-2 border">{t('booking_table.accessories')}</th>
            <th className="px-3 py-2 border min-w-[160px]">{t('booking_table.battery_info')}</th>
            <th className="px-3 py-2 border min-w-[200px]">{t('booking_table.notes')}</th>
            <th className="px-3 py-2 border min-w-[160px]">{t('booking_table.station')}</th>
            <th className="px-3 py-2 border">{t('booking_table.created_by')}</th>
            <th className="px-3 py-2 border">{t('booking_table.booked_at')}</th>
            <th className="px-3 py-2 border">{t('booking_table.status_label')}</th>
            <th className="px-3 py-2 border min-w-[200px]">{t('booking_table.status_comment')}</th>
            {actionsVisible && (
              <th className="px-3 py-2 border">{t('booking_table.actions')}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {[...bookings]
            .sort((a, b) => createdSecs(b) - createdSecs(a))
            .map((b) => {
              const pkgName =
                (b as any)?.package ? (packageNames[(b as any).package] || 'N/A') : 'N/A';
              const companyName = companyNames[b.companyId ?? ''] || 'N/A';
              const stationName = stationNames[b.stationId ?? ''] || 'N/A';
              const createdAtStr = safeFormatDate(b.createdAt, 'dd/MM/yyyy HH:mm');

              return (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 border align-top">
                    <div className="font-semibold">{b.fullName}</div>
                    <div className="text-xs text-gray-600">{b.phone}</div>
                    <div className="text-xs text-gray-600">{b.idNumber}</div>
                  </td>

                  <td className="px-3 py-3 border align-top">
                    <div className="font-medium">{b.vehicleModel}</div>
                    <div className="text-xs text-gray-600">VIN: {b.vin || 'N/A'}</div>
                    <div className="text-xs text-gray-600">
                      {t('booking_table.plate')}: {b.licensePlate || 'N/A'}
                    </div>
                  </td>

                  <td className="px-3 py-3 border align-top">
                    <div className="text-green-600 font-bold text-lg">
                      {formatCurrency(b.totalAmount)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('booking_table.package')}: {pkgName}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('booking_table.deposit')}: {formatCurrency(b.deposit)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {t('booking_table.remaining')}: {formatCurrency(b.remainingBalance)}
                    </div>
                  </td>

                  <td className="px-3 py-3 border align-top">
                    <div className="text-xs text-gray-600">
                      {safeFormatDate(b.rentalStartDate)} → {safeFormatDate(b.rentalEndDate)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ({b.rentalDays ?? 'N/A'} {t('booking_table.days')})
                    </div>
                  </td>

                  <td className="px-3 py-3 border align-top">
                    <div className="flex items-center gap-1">
                      <Truck className="h-4 w-4 text-blue-600" />
                      {t(`delivery_method.${b.deliveryMethod}`, { defaultValue: b.deliveryMethod })}
                    </div>
                    {b.deliveryMethod === 'Deliver to Address' && b.deliveryAddress && (
                      <div className="text-xs text-gray-600 ml-6">{b.deliveryAddress}</div>
                    )}
                  </td>

                  <td className="px-3 py-3 border align-top text-xs text-gray-700">
                    {b.helmet && <div>✔ {t('booking_table.helmet')}</div>}
                    {b.charger && <div>✔ {t('booking_table.charger')}</div>}
                    {b.phoneHolder && <div>✔ {t('booking_table.phone_holder')}</div>}
                    {b.rearRack && <div>✔ {t('booking_table.rear_rack')}</div>}
                    {b.raincoat && <div>✔ {t('booking_table.raincoat')}</div>}
                    {!b.helmet && !b.charger && !b.phoneHolder && !b.rearRack && !b.raincoat && (
                      <div className="italic text-gray-400">{t('booking_table.none')}</div>
                    )}
                  </td>

                  <td className="px-3 py-3 border align-top text-xs text-gray-700">
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
                  </td>

                  <td className="px-3 py-3 border align-top text-xs text-gray-700">
                    {b.note || <div className="italic text-gray-400">{t('booking_table.no_notes')}</div>}
                  </td>

                  <td className="px-3 py-3 border align-top">
                    <div className="font-medium">{stationName}</div>
                    <div className="text-xs text-gray-600">{companyName}</div>
                  </td>

                  <td className="px-3 py-3 border align-top text-xs text-gray-600">
                    {b.userId
                      ? userNames[b.userId] || t('booking_table.unknown_user')
                      : <div className="italic text-gray-400">{t('booking_table.unknown')}</div>}
                  </td>

                  <td className="px-3 py-3 border align-top text-xs text-gray-600">
                    {createdAtStr}
                  </td>

                  <td className="px-3 py-3 border align-top text-xs font-medium text-center">
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
                  </td>

                  <td className="px-3 py-3 border align-top text-xs text-gray-700 whitespace-pre-wrap">
                    {b.statusComment || (
                      <span className="italic text-gray-400">{t('booking_table.no_comment')}</span>
                    )}
                  </td>

                  {actionsVisible && (
                    <td className="px-3 py-3 border align-top">
                      <div className="flex flex-col gap-2">
                        {onEdit && (
                          <Button
                            size="sm"
                            onClick={() => onEdit(b)}
                            className="bg-[#00d289] hover:bg-green-600 text-white"
                          >
                            {t('booking_table.update')}
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => onDelete(b.id)}
                          >
                            {t('booking_table.delete')}
                          </Button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
  );
}
