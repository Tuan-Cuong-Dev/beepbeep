'use client';

import { Battery } from '@/src/lib/batteries/batteryTypes';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';
import { printSingleBatteryQR } from './printSingleBatteryQR';
import { Button } from '@/src/components/ui/button';
import { useTranslation } from 'react-i18next';

interface Props {
  batteries: Battery[];
  setBatteries?: (batteries: Battery[]) => void;
  onEdit?: (battery: Battery) => void;
  onDelete?: (id: string) => void;
}

export default function BatteryTableMobile({
  batteries,
  setBatteries,
  onEdit,
  onDelete,
}: Props) {
  const { t } = useTranslation('common');

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

  const getStatusLabel = (status: Battery['status']) =>
    t(`status.${status}`, { defaultValue: status });

  if (batteries.length === 0) {
    return (
      <div className="text-center text-gray-500 p-6">
        {t('battery_table.no_batteries')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 mt-4">
      {batteries.map((battery) => (
        <div
          key={battery.id}
          className="bg-white rounded-xl shadow p-4 text-sm space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="font-bold text-gray-800">
              🔋 {battery.batteryCode}
            </div>
            <span
              className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                battery.status
              )}`}
            >
              {getStatusLabel(battery.status)}
            </span>
          </div>

          <div className="text-center">
            <div className="inline-block bg-white p-1 rounded">
              <QRCode value={battery.batteryCode} size={64} />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {battery.physicalCode || '—'}
            </div>
          </div>

          <div className="text-xs text-gray-700">
            <strong>{t('battery_table.import_date')}:</strong>{' '}
            {formatDate(battery.importDate)}
            <br />
            <strong>{t('battery_table.export_date')}:</strong>{' '}
            {formatDate(battery.exportDate)}
          </div>

          <div className="text-xs text-gray-700">
            <strong>{t('battery_table.notes')}:</strong>{' '}
            {battery.notes || (
              <span className="italic text-gray-400">{t('common.none')}</span>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                className="w-full"
                onClick={() => onDelete(battery.id)}
              >
                {t('actions.delete')}
              </Button>
            )}

            {onEdit && (
              <Button
                size="sm"
                className="w-full bg-[#00d289] hover:bg-green-600 text-white"
                onClick={() => onEdit(battery)}
              >
                {t('actions.edit')}
              </Button>
            )}

            {setBatteries && (
              <Button
                size="sm"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => printSingleBatteryQR(battery)}
              >
                {t('actions.print')}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
