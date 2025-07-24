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

export default function BatteryChargingStationSearchBar({
  searchTerm,
  vehicleFilter,
  statusFilter,
  setSearchTerm,
  setVehicleFilter,
  setStatusFilter,
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4 w-full">
      <Input
        placeholder="Search charging station..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full"
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
        className="w-full"
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
        className="w-full"
      />
    </div>
  );
}
