// 📁 pages/admin/battery-stations/BatteryStationManagementPage.tsx
'use client';

import { useState } from 'react';
import { useBatteryStations } from '@/src/hooks/useBatteryStations';
import BatteryStationTable from '@/src/components/battery-stations/BatteryStationTable';
import BatteryStationForm from '@/src/components/battery-stations/BatteryStationForm';
import BatteryStationSearchBar from '@/src/components/battery-stations/BatteryStationSearchBar';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';

export default function BatteryStationManagementPage() {
  const {
    stations,
    loading,
    reload,
    create,
    update,
    remove,
  } = useBatteryStations();

  const [editing, setEditing] = useState<BatteryStation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = stations.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.displayAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVehicle = vehicleFilter ? s.vehicleType === vehicleFilter : true;
    const matchStatus = statusFilter ? String(s.isActive) === statusFilter : true;
    return matchSearch && matchVehicle && matchStatus;
  });

  const handleSave = async (data: Omit<BatteryStation, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editing) {
      await update(editing.id, data);
    } else {
      await create(data);
    }
    setEditing(null);
    await reload();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Battery Stations Management</h1>

      <BatteryStationForm
        station={editing || undefined}
        onSave={handleSave}
        onCancel={() => setEditing(null)}
      />

      <BatteryStationSearchBar
        searchTerm={searchTerm}
        vehicleFilter={vehicleFilter}
        statusFilter={statusFilter}
        setSearchTerm={setSearchTerm}
        setVehicleFilter={setVehicleFilter}
        setStatusFilter={setStatusFilter}
      />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <BatteryStationTable
          stations={filtered}
          onEdit={setEditing}
          onDelete={async (id) => {
            await remove(id);
            await reload();
          }}
        />
      )}
    </div>
  );
}