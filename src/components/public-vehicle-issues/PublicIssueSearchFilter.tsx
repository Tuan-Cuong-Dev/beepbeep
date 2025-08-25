'use client';

import { Input } from '@/src/components/ui/input';
import { SimpleSelect } from '@/src/components/ui/select';
import { useTranslation } from 'react-i18next';
import type { PublicVehicleIssue } from '@/src/lib/publicVehicleIssues/publicVehicleIssueTypes';

type Status = PublicVehicleIssue['status'] | 'All';
type Approve = 'pending' | 'approved' | 'rejected' | 'All';

// ---------- Discriminated union theo mode ----------
type BaseProps = {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  stationFilter?: string;
  setStationFilter?: (val: string) => void;
};

type StatusProps = BaseProps & {
  mode?: 'status'; // default
  statusFilter: Status;
  setStatusFilter: (val: Status) => void;
};

type ApproveProps = BaseProps & {
  mode: 'approve';
  statusFilter: Approve;
  setStatusFilter: (val: Approve) => void;
};

type Props = StatusProps | ApproveProps;

export default function PublicIssuesSearchFilter(props: Props) {
  const { t } = useTranslation('common', { keyPrefix: 'public_issues_search_filter' });

  const {
    searchTerm,
    setSearchTerm,
    stationFilter,
    setStationFilter,
  } = props;

  // Xây options và label theo mode
  const isApproveMode = props.mode === 'approve';

  const statusOptions = isApproveMode
    ? [
        { label: t('approval.all', 'All'), value: 'All' },
        { label: t('approval.pending', 'Pending'), value: 'pending' },
        { label: t('approval.approved', 'Approved'), value: 'approved' },
        { label: t('approval.rejected', 'Rejected'), value: 'rejected' },
      ]
    : [
        { label: t('status.all', 'All'), value: 'All' },
        { label: t('status.pending', 'Pending'), value: 'pending' },
        { label: t('status.assigned', 'Assigned'), value: 'assigned' },
        { label: t('status.proposed', 'Proposed'), value: 'proposed' },
        { label: t('status.confirmed', 'Confirmed'), value: 'confirmed' },
        { label: t('status.rejected', 'Rejected'), value: 'rejected' },
        { label: t('status.in_progress', 'In Progress'), value: 'in_progress' },
        { label: t('status.resolved', 'Resolved'), value: 'resolved' },
        { label: t('status.closed', 'Closed'), value: 'closed' },
      ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {/* Search */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {t('search_label', 'Search')}
        </label>
        <Input
          placeholder={t('search_placeholder', 'Search by name, phone, vehicle, address...')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Status / Approval */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          {isApproveMode
            ? t('approval.label', 'Approval Status')
            : t('status_label', 'Status')}
        </label>
        <SimpleSelect
          value={props.statusFilter}
          onChange={(v) =>
            // TS suy luận đúng nhờ discriminated union
            (props.setStatusFilter as (val: string) => void)(v)
          }
          options={statusOptions}
        />
      </div>
    </div>
  );
}
