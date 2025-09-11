//Agent -  Giới thiệu khách hàng và lịch sử hoa hồng

'use client';

import { formatCurrency } from '@/src/utils/formatCurrency';
import { safeFormatDate } from '@/src/utils/safeFormatDate';
import type { CommissionTxn } from '@/src/lib/commision/commissionTypes';

export default function CommissionHistoryTable({ txns }: { txns: CommissionTxn[] }) {
  if (!txns.length) return <div className="text-center text-gray-500 py-6">Chưa có giao dịch hoa hồng.</div>;

  return (
    <div className="bg-white rounded-xl shadow p-4 overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-3 py-2 border">Ngày</th>
            <th className="px-3 py-2 border">Loại</th>
            <th className="px-3 py-2 border">Liên quan</th>
            <th className="px-3 py-2 border">Số tiền</th>
            <th className="px-3 py-2 border">Trạng thái</th>
            <th className="px-3 py-2 border">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {txns.map(x => (
            <tr key={x.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 border">{safeFormatDate(x.createdAt, 'dd/MM/yyyy HH:mm')}</td>
              <td className="px-3 py-2 border">{x.type}</td>
              <td className="px-3 py-2 border text-xs">
                {x.bookingId && <div>Booking: <span className="font-medium">{x.bookingId}</span></div>}
                {x.referralId && <div>Referral: <span className="font-medium">{x.referralId}</span></div>}
              </td>
              <td className="px-3 py-2 border font-semibold text-green-600">{formatCurrency(x.amount)}</td>
              <td className="px-3 py-2 border">
                <span className="inline-block px-2 py-1 rounded-full text-white text-xs"
                  style={{backgroundColor: x.status === 'paid' ? '#22c55e' : x.status === 'approved' ? '#3b82f6' : x.status === 'rejected' ? '#ef4444' : '#f59e0b'}}>
                  {x.status}
                </span>
              </td>
              <td className="px-3 py-2 border text-xs text-gray-600 whitespace-pre-wrap">{x.note || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
