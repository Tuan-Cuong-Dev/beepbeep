'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { X } from 'lucide-react';
import Header from '@/src/components/landingpage/Header';
import VehicleSwitcher from './VehicleSwitcher';

const MapWrapper = dynamic(() => import('./MapWrapper'), { ssr: false });
const TechnicianMarkers = dynamic(() => import('./TechnicianMarkers'), { ssr: false });
const RentalStationMarkers = dynamic(() => import('./RentalStationMarkers'), { ssr: false });
const BatteryStationMarkers = dynamic(() => import('./BatteryStationMarkers'), { ssr: false });

interface MyMapViewProps {
  onClose?: () => void;
}

export default function MyMapView({ onClose }: MyMapViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'rental' | 'battery' | 'maintenance'>('all');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorbike' | 'bike'>('motorbike');

  const showAll = activeTab === 'all';

  const shouldShowBatteryStations =
    (showAll || activeTab === 'battery') && vehicleType !== 'bike'; // ✅ KHÔNG hiển thị BatteryStations nếu là 'bike'

  return (
    <div className="h-full w-full relative flex flex-col">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[1000] bg-white rounded-full shadow p-2 hover:bg-gray-100"
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>
      )}

      <Header />

      {/* Vehicle switcher */}
      <VehicleSwitcher vehicleType={vehicleType} onChange={setVehicleType} />

      {/* Map display */}
      <div className="flex-1 relative">
        <MapWrapper key={activeTab + '-' + vehicleType}>
          {(showAll || activeTab === 'rental') && (
            <RentalStationMarkers vehicleType={showAll ? undefined : vehicleType} />
          )}
          {shouldShowBatteryStations && (
            <BatteryStationMarkers vehicleType={showAll ? undefined : vehicleType} />
          )}
          {(showAll || activeTab === 'maintenance') && (
            <TechnicianMarkers vehicleType={showAll ? undefined : vehicleType} />
          )}
        </MapWrapper>
      </div>

      {/* Bottom tabs */}
      <div className="bg-white border-t py-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="w-full overflow-x-auto">
            <TabsList className="flex gap-2 bg-white rounded-full px-4 py-2 min-w-max whitespace-nowrap">
              <TabsTrigger value="all">🗺️ All</TabsTrigger>
              <TabsTrigger value="rental">🏪 Rental Stations</TabsTrigger>
              <TabsTrigger value="battery">🔄 Battery Swap</TabsTrigger>
              <TabsTrigger value="maintenance">🔧 Maintenance</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
