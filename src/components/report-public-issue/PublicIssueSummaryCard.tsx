'use client';

import { PublicIssue } from '@/src/lib/publicIssue/publicIssueTypes';
import { Card } from '@/src/components/ui/card';
import {
  Bug,
  ClipboardCheck,
  Wrench,
  Loader2,
  CheckCircle,
  Ban,
  Lightbulb,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
  issues: PublicIssue[];
}

export default function PublicIssuesSummaryCard({ issues }: Props) {
  const { t } = useTranslation('common', { keyPrefix: 'public_issues_summary_card' });

  const total = issues.length;
  const statusCounts = {
    pending: issues.filter((i) => i.status === 'pending').length,
    assigned: issues.filter((i) => i.status === 'assigned').length,
    proposed: issues.filter((i) => i.status === 'proposed').length,
    confirmed: issues.filter((i) => i.status === 'confirmed').length,
    rejected: issues.filter((i) => i.status === 'rejected').length,
    in_progress: issues.filter((i) => i.status === 'in_progress').length,
    resolved: issues.filter((i) => i.status === 'resolved').length,
    closed: issues.filter((i) => i.status === 'closed').length,
  };

  const items = [
    {
      title: t('total'),
      value: total,
      color: 'text-black',
      icon: <Bug className="w-6 h-6 text-gray-500" />,
      bg: 'bg-gray-100',
    },
    {
      title: t('pending'),
      value: statusCounts.pending,
      color: 'text-yellow-600',
      icon: <ClipboardCheck className="w-6 h-6 text-yellow-600" />,
      bg: 'bg-yellow-50',
    },
    {
      title: t('assigned'),
      value: statusCounts.assigned,
      color: 'text-blue-600',
      icon: <Wrench className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      title: t('proposed'),
      value: statusCounts.proposed,
      color: 'text-yellow-700',
      icon: <Lightbulb className="w-6 h-6 text-yellow-700" />,
      bg: 'bg-yellow-100',
    },
    {
      title: t('confirmed'),
      value: statusCounts.confirmed,
      color: 'text-green-700',
      icon: <ShieldCheck className="w-6 h-6 text-green-700" />,
      bg: 'bg-green-100',
    },
    {
      title: t('rejected'),
      value: statusCounts.rejected,
      color: 'text-red-600',
      icon: <XCircle className="w-6 h-6 text-red-600" />,
      bg: 'bg-red-100',
    },
    {
      title: t('in_progress'),
      value: statusCounts.in_progress,
      color: 'text-indigo-600',
      icon: <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />,
      bg: 'bg-indigo-50',
    },
    {
      title: t('resolved'),
      value: statusCounts.resolved,
      color: 'text-green-600',
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      bg: 'bg-green-50',
    },
    {
      title: t('closed'),
      value: statusCounts.closed,
      color: 'text-gray-500',
      icon: <Ban className="w-6 h-6 text-gray-500" />,
      bg: 'bg-gray-100',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 gap-3 mb-6">
      {items.map((item, idx) => (
        <Card
          key={idx}
          className={`flex flex-col justify-between rounded-2xl p-4 shadow-sm border ${item.bg}`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              {item.title}
            </span>
            {item.icon}
          </div>
          <p className={`text-2xl sm:text-3xl font-bold ${item.color}`}>{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
