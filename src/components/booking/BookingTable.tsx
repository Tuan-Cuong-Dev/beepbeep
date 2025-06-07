'use client';

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

export default function BookingTable({
  bookings,
  stationNames,
  companyNames,
  packageNames,
  userNames,
  onEdit,
  onDelete,
}: Props) {
  if (!bookings.length) {
    return <div className="text-center text-gray-500 p-8">No bookings found.</div>;
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto mt-6">
      <table className="min-w-full text-sm border border-gray-200">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 border min-w-[120px]">Customer</th>
            <th className="px-3 py-2 border min-w-[190px]">Vehicle Info</th>
            <th className="px-3 py-2 border min-w-[160px]">Pricing</th>
            <th className="px-3 py-2 border">Rental Period</th>
            <th className="px-3 py-2 border min-w-[160px]">Rental Method</th>
            <th className="px-3 py-2 border">Accessories</th>
            <th className="px-3 py-2 border min-w-[160px]">Battery Info</th>
            <th className="px-3 py-2 border min-w-[200px]">Notes</th>
            <th className="px-3 py-2 border min-w-[160px]">Station</th>
            <th className="px-3 py-2 border">Created By</th>
            <th className="px-3 py-2 border">Booked At</th>
            <th className="px-3 py-2 border">Status</th>
            <th className="px-3 py-2 border min-w-[200px]">Status Comment</th>
            <th className="px-3 py-2 border">Actions</th>
          </tr>
        </thead>

        <tbody>
          {[...bookings]
          .sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds)
          .map((b) => (
            <tr key={b.id} className="hover:bg-gray-50">
              <td className="px-3 py-3 border align-top">
                <div className="font-semibold">{b.fullName}</div>
                <div className="text-xs text-gray-600">{b.phone}</div>
                <div className="text-xs text-gray-600">{b.idNumber}</div>
              </td>

              <td className="px-3 py-3 border align-top">
                <div className="font-medium">{b.vehicleModel}</div>
                <div className="text-xs text-gray-600">VIN: {b.vin || 'N/A'}</div>
                <div className="text-xs text-gray-600">Plate: {b.licensePlate || 'N/A'}</div>
              </td>

              <td className="px-3 py-3 border align-top">
                <div className="text-green-600 font-bold text-lg">{formatCurrency(b.totalAmount)}</div>
                <div className="text-xs text-gray-600">Package: {packageNames[b.package ?? ''] || 'N/A'}</div>
                <div className="text-xs text-gray-600">Deposit: {formatCurrency(b.deposit)}</div>
                <div className="text-xs text-gray-600">Remaining: {formatCurrency(b.remainingBalance)}</div>
              </td>

              <td className="px-3 py-3 border align-top">
                <div className="text-xs text-gray-600">
                  {safeFormatDate(b.rentalStartDate)} → {safeFormatDate(b.rentalEndDate)}
                </div>
                <div className="text-xs text-gray-500">({b.rentalDays ?? 'N/A'} days)</div>
              </td>

              <td className="px-3 py-3 border align-top">
                <div className="flex items-center gap-1">
                  <Truck className="h-4 w-4 text-blue-600" />
                  {b.deliveryMethod}
                </div>
                {b.deliveryMethod === 'Deliver to Address' && b.deliveryAddress && (
                  <div className="text-xs text-gray-600 ml-6">{b.deliveryAddress}</div>
                )}
              </td>

              <td className="px-3 py-3 border align-top text-xs text-gray-700">
                {b.helmet && <div>✔ Helmet</div>}
                {b.charger && <div>✔ Charger</div>}
                {b.phoneHolder && <div>✔ Phone Holder</div>}
                {b.rearRack && <div>✔ Rear Rack</div>}
                {b.raincoat && <div>✔ Raincoat</div>}
                {!b.helmet && !b.charger && !b.phoneHolder && !b.rearRack && !b.raincoat && (
                  <div className="italic text-gray-400">None</div>
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
                  <div className="italic text-gray-400">No Batteries</div>
                )}
              </td>

              <td className="px-3 py-3 border align-top text-xs text-gray-700">
                {b.note || <div className="italic text-gray-400">No Notes</div>}
              </td>

              <td className="px-3 py-3 border align-top">
                <div className="font-medium">{stationNames[b.stationId ?? ''] || 'N/A'}</div>
                <div className="text-xs text-gray-600">{companyNames[b.companyId ?? ''] || 'N/A'}</div>
              </td>

              <td className="px-3 py-3 border align-top text-xs text-gray-600">
                {b.userId ? userNames[b.userId] || 'Unknown User' : <div className="italic text-gray-400">Unknown</div>}
              </td>

              <td className="px-3 py-3 border align-top text-xs text-gray-600">
                {safeFormatDate(b.createdAt, 'dd/MM/yyyy HH:mm')}
              </td>

              <td className="px-3 py-3 border align-top text-xs font-medium text-center">
                <span className="inline-block px-2 py-1 rounded-full text-white text-xs"
                  style={{
                    backgroundColor:
                      b.bookingStatus === 'confirmed'
                        ? '#22c55e'
                        : b.bookingStatus === 'cancelled'
                        ? '#ef4444'
                        : b.bookingStatus === 'completed'
                        ? '#3b82f6'
                        : '#f59e0b', // default: draft/pending
                  }}
                >
                  {b.bookingStatus ?? 'draft'}
                </span>
              </td>
              
              <td className="px-3 py-3 border align-top text-xs text-gray-700 whitespace-pre-wrap">
                {b.statusComment || <span className="italic text-gray-400">No Comment</span>}
              </td>
              
              <td className="px-3 py-3 border align-top">
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => onEdit(b)} className="bg-[#00d289] hover:bg-green-600 text-white">Update</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDelete(b.id)}>Delete</Button>
                </div>
              </td>
            </tr>
        ))}

        </tbody>
      </table>
    </div>
  );
}
