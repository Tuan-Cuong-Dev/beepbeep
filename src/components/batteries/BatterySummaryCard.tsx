'use client';

import { Battery } from '@/src/lib/batteries/batteryTypes';
import { Card, CardContent } from '@/src/components/ui/card';
import {
  BatteryCharging,
  PackageCheck,
  PackageOpen,
  History,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  batteries: Battery[];
}

export default function BatterySummaryCard({ batteries }: Props) {
  const { t } = useTranslation('common');

  const total = batteries.length;
  const inStock = batteries.filter((b) => b.status === 'in_stock').length;
  const inUse = batteries.filter((b) => b.status === 'in_use').length;
  const returned = batteries.filter((b) => b.status === 'returned').length;
  const maintenance = batteries.filter((b) => b.status === 'maintenance').length;

  const items = [
    {
      title: t('battery_summary_card.total'),
      value: total,
      color: 'text-black',
      icon: <BatteryCharging className="text-gray-500 w-5 h-5" />,
    },
    {
      title: t('battery_summary_card.in_stock'),
      value: inStock,
      color: 'text-green-600',
      icon: <PackageCheck className="text-green-600 w-5 h-5" />,
    },
    {
      title: t('battery_summary_card.in_use'),
      value: inUse,
      color: 'text-blue-600',
      icon: <PackageOpen className="text-blue-600 w-5 h-5" />,
    },
    {
      title: t('battery_summary_card.returned'),
      value: returned,
      color: 'text-gray-600',
      icon: <History className="text-gray-600 w-5 h-5" />,
    },
    {
      title: t('battery_summary_card.maintenance'),
      value: maintenance,
      color: 'text-yellow-600',
      icon: <Wrench className="text-yellow-600 w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
      {items.map((item, idx) => (
        <Card key={idx} className="shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm text-gray-500 mb-1">{item.title}</h2>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
            <div>{item.icon}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
