'use client';

import { Card, CardContent } from '@/src/components/ui/card';
import {
  BadgeCheck,
  AlertTriangle,
  Wrench,
  Archive,
  Car,
  HelpCircle,
  Layers,
} from 'lucide-react';

interface Props {
  status: string;
  count: number;
  total: number;
}

export default function EbikeSummaryCard({ status, count, total }: Props) {
  const statusStyleMap: Record<
    string,
    { color: string; icon: React.ReactNode }
  > = {
    Total: {
      color: 'bg-white text-black border border-gray-300',
      icon: <Layers className="w-5 h-5 text-black" />,
    },
    Available: {
      color: 'bg-green-100 text-green-800',
      icon: <BadgeCheck className="w-5 h-5 text-green-600" />,
    },
    Reserved: {
      color: 'bg-blue-100 text-blue-800',
      icon: <HelpCircle className="w-5 h-5 text-blue-600" />,
    },
    'In Use': {
      color: 'bg-orange-100 text-orange-800',
      icon: <Car className="w-5 h-5 text-orange-600" />,
    },
    'Under Maintenance': {
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Wrench className="w-5 h-5 text-yellow-600" />,
    },
    Broken: {
      color: 'bg-red-100 text-red-800',
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
    },
    Sold: {
      color: 'bg-gray-100 text-gray-800',
      icon: <Archive className="w-5 h-5 text-gray-600" />,
    },
  };

  const style = statusStyleMap[status] || {
    color: 'bg-gray-100 text-gray-700',
    icon: <HelpCircle className="w-5 h-5 text-gray-500" />,
  };

  const percentage =
    status === 'Total'
      ? ''
      : total > 0
      ? ((count / total) * 100).toFixed(1) + '%'
      : '0%';

  return (
    <Card
      className={`text-center ${style.color} border-0 shadow-sm hover:shadow-md transition-all`}
    >
      <CardContent className="flex flex-col items-center justify-center gap-1 py-6">
        <div>{style.icon}</div>
        <div className="text-sm font-semibold">{status}</div>
        <div className="text-3xl font-bold leading-tight">{count}</div>
        {status !== 'Total' && (
          <div className="text-xs text-muted-foreground">{percentage} of total</div>
        )}
      </CardContent>
    </Card>
  );
}
