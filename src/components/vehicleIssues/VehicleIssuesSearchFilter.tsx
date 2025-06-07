'use client';

import { Input } from '@/src/components/ui/input';
import { SimpleSelect } from '@/src/components/ui/select';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <Input
          placeholder="🔍 VIN, Plate, Description"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
        <SimpleSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { label: 'All', value: 'All' },
            { label: 'Pending', value: 'pending' },
            { label: 'Assigned', value: 'assigned' },
            { label: 'Proposed', value: 'proposed' },
            { label: 'Confirmed', value: 'confirmed' },
            { label: 'Rejected', value: 'rejected' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Resolved', value: 'resolved' },
            { label: 'Closed', value: 'closed' },
          ]}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
        <SimpleSelect
          value={stationFilter}
          onChange={setStationFilter}
          options={[{ label: 'All', value: '' }, ...stationOptions]}
        />
      </div>
    </div>
  );
}
