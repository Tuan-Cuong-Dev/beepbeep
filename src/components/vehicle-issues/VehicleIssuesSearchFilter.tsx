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
  stationOptions: { label: string; value: string }[];
}

export default function VehicleIssuesSearchFilter({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  stationFilter,
  setStationFilter,
  stationOptions,
}: Props) {
  const { t } = useTranslation('common');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('vehicle_issues_search_filter.search')}
        </label>
        <Input
          placeholder={t('vehicle_issues_search_filter.placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('vehicle_issues_search_filter.status')}
        </label>
        <SimpleSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: t('vehicle_issues_search_filter.all'), value: 'All' },
            { label: t('vehicle_issues_summary_card.pending'), value: 'pending' },
            { label: t('vehicle_issues_summary_card.assigned'), value: 'assigned' },
            { label: t('vehicle_issues_summary_card.proposed'), value: 'proposed' },
            { label: t('vehicle_issues_summary_card.confirmed'), value: 'confirmed' },
            { label: t('vehicle_issues_summary_card.rejected'), value: 'rejected' },
            { label: t('vehicle_issues_summary_card.in_progress'), value: 'in_progress' },
            { label: t('vehicle_issues_summary_card.resolved'), value: 'resolved' },
            { label: t('vehicle_issues_summary_card.closed'), value: 'closed' },
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('vehicle_issues_search_filter.station')}
        </label>
        <SimpleSelect
          value={stationFilter}
          onChange={setStationFilter}
          options={[{ label: t('vehicle_issues_search_filter.all'), value: '' }, ...stationOptions]}
        />
      </div>
    </div>
  );
}
