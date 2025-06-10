'use client';

import { Battery } from '@/src/lib/batteries/batteryTypes';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { printSingleBatteryQR } from './printSingleBatteryQR';
import { Button } from '@/src/components/ui/button';

interface Props {
  batteries: Battery[];
  setBatteries?: (batteries: Battery[]) => void;
  onEdit?: (battery: Battery) => void;
  onDelete?: (id: string) => void;
}

export default function BatteryTable({ batteries, onEdit, onDelete, setBatteries }: Props) {
  const formatDate = (timestamp?: any) => {
    if (!timestamp?.toDate) return '—';
    return format(timestamp.toDate(), 'dd/MM/yyyy');
  };

  const getStatusColor = (status: Battery['status']) => {
    switch (status) {
      case 'in_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_use':
        return 'bg-green-100 text-green-800';
      case 'returned':
        return 'bg-gray-200 text-gray-800';
      case 'maintenance':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusLabel = (status: Battery['status']) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'in_use':
        return 'In Use';
      case 'returned':
        return 'Returned';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="overflow-x-auto bg-white shadow rounded-xl">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="px-4 py-2 border">Battery Code</th>
            <th className="px-4 py-2 border">QR (Physical Code)</th>
            <th className="px-4 py-2 border">Import Date</th>
            <th className="px-4 py-2 border">Export Date</th>
            <th className="px-4 py-2 border">Status</th>
            <th className="px-4 py-2 border">Notes</th>
            <th className="px-4 py-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {batteries.map((battery) => (
            <tr key={battery.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 border font-medium whitespace-nowrap">
                {battery.batteryCode}
              </td>

              <td className="px-4 py-2 border text-center">
                <div className="inline-block bg-white p-1 rounded">
                  <QRCode value={battery.batteryCode} size={48} />
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {battery.physicalCode || '—'}
                </div>
              </td>

              <td className="px-4 py-2 border whitespace-nowrap">
                {formatDate(battery.importDate)}
              </td>

              <td className="px-4 py-2 border whitespace-nowrap">
                {formatDate(battery.exportDate)}
              </td>

              <td className="px-4 py-2 border text-center">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(battery.status)}`}>
                  {getStatusLabel(battery.status)}
                </span>
              </td>

              <td className="px-4 py-2 border">
                {battery.notes || '—'}
              </td>

              <td className="border px-3 py-2 space-y-2 flex flex-col">
                {onDelete && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(battery.id)}
                  >
                    Delete
                  </Button>
                )}

                {onEdit && (
                  <Button
                    size="sm"
                    className="bg-[#00d289] hover:bg-green-600 text-white"
                    onClick={() => onEdit(battery)}
                  >
                    Edit
                  </Button>
                )}

                {setBatteries && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => printSingleBatteryQR(battery)}
                  >
                    Print
                  </Button>
                )}
              </td>
            </tr>
          ))}
          {batteries.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center py-4 text-gray-500">
                No batteries found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
