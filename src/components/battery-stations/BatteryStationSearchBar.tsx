'use client';

import { Input } from '@/src/components/ui/input';
import { SimpleSelect } from '@/src/components/ui/select';

interface Props {
  searchTerm: string;
  vehicleFilter: string;
  statusFilter: string;
  setSearchTerm: (value: string) => void;
  setVehicleFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
}

export default function BatteryStationSearchBar({
  searchTerm,
  vehicleFilter,
  statusFilter,
  setSearchTerm,
  setVehicleFilter,
  setStatusFilter,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <Input
        placeholder="Search by name or address..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-60"
      />

      <SimpleSelect
        value={vehicleFilter}
        onChange={setVehicleFilter}
        placeholder="Vehicle Type"
        options={[
          { label: 'All', value: '' },
          { label: 'Motorbike', value: 'motorbike' },
          { label: 'Car', value: 'car' },
        ]}
        className="w-40"
      />

      <SimpleSelect
        value={statusFilter}
        onChange={setStatusFilter}
        placeholder="Status"
        options={[
          { label: 'All', value: '' },
          { label: 'Active', value: 'true' },
          { label: 'Inactive', value: 'false' },
        ]}
        className="w-40"
      />
    </div>
  );
}
