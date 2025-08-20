'use client';

import { Input } from '@/src/components/ui/input';
import { SimpleSelect } from '@/src/components/ui/select';
import { useTranslation } from 'react-i18next';

interface Props {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  stationFilter: string;
  setStationFilter: (val: string) => void;
}

export default function PublicIssuesSearchFilter({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  stationFilter,
  setStationFilter,
}: Props) {
  const { t } = useTranslation('common', { keyPrefix: 'public_issues_search_filter' });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('search_label')}
        </label>
        <Input
          placeholder={t('search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('status_label')}
        </label>
        <SimpleSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: t('status.all'), value: 'All' },
            { label: t('status.pending'), value: 'pending' },
            { label: t('status.assigned'), value: 'assigned' },
            { label: t('status.proposed'), value: 'proposed' },
            { label: t('status.confirmed'), value: 'confirmed' },
            { label: t('status.rejected'), value: 'rejected' },
            { label: t('status.in_progress'), value: 'in_progress' },
            { label: t('status.resolved'), value: 'resolved' },
            { label: t('status.closed'), value: 'closed' },
          ]}
        />
      </div>
    </div>
  );
}
