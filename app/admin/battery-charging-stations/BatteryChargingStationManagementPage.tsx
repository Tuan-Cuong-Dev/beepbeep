'use client';

import { useState } from 'react';
import { useBatteryChargingStations } from '@/src/hooks/useBatteryChargingStations';
import BatteryChargingStationForm from '@/src/components/battery-charging-stations/BatteryChargingStationForm';
import BatteryChargingStationSearchBar from '@/src/components/battery-charging-stations/BatteryChargingStationSearchBar';
import BatteryChargingStationTable from '@/src/components/battery-charging-stations/BatteryChargingStationTable';
import { BatteryChargingStation } from '@/src/lib/batteryChargingStations/batteryChargingStationTypes';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';

export default function BatteryChargingStationManagementPage() {
  const {
    stations,
    loading,
    reload,
    create,
    update,
    remove,
  } = useBatteryChargingStations();

  const [editing, setEditing] = useState<BatteryChargingStation | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = stations.filter((s) => {
    const matchSearch =
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.displayAddress?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchVehicle = vehicleFilter ? s.vehicleType === vehicleFilter : true;
    const matchStatus = statusFilter ? String(s.isActive) === statusFilter : true;
    return matchSearch && matchVehicle && matchStatus;
  });

  const handleSave = async (
    data: Omit<BatteryChargingStation, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editing) {
      await update(editing.id, data);
    } else {
      await create(data);
    }
    setEditing(null);
    await reload();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow p-4 space-y-4">
        <h1 className="text-2xl font-bold border-b-2 border-[#00d289] pb-2">
          Battery Charging Stations Management
        </h1>

        <BatteryChargingStationForm
          station={editing || undefined}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />

        <BatteryChargingStationSearchBar
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
          <BatteryChargingStationTable
            stations={filtered}
            onEdit={setEditing}
            onDelete={async (id) => {
              await remove(id);
              await reload();
            }}
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
