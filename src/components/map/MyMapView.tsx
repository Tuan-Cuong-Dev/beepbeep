'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { X } from 'lucide-react';
import Header from '@/src/components/landingpage/Header';

const MapWrapper = dynamic(() => import('./MapWrapper'), { ssr: false });
const TechnicianMarkers = dynamic(() => import('./TechnicianMarkers'), { ssr: false });
const RentalStationMarkers = dynamic(() => import('./RentalStationMarkers'), { ssr: false });
const BatteryStationMarkers = dynamic(() => import('./BatteryStationMarkers'), { ssr: false });


interface MyMapViewProps {
  onClose?: () => void;
}

export default function MyMapView({ onClose }: MyMapViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'rental' | 'battery' | 'maintenance'>('all');

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
      <div className="flex-1 relative">
        <MapWrapper key={activeTab}>
          {(activeTab === 'all' || activeTab === 'rental') && <RentalStationMarkers />}
          {(activeTab === 'all' || activeTab === 'battery') && <BatteryStationMarkers />}
          {(activeTab === 'all' || activeTab === 'maintenance') && <TechnicianMarkers />}
        </MapWrapper>
      </div>

      <div className="bg-white border-t py-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList
          className="w-full overflow-x-auto whitespace-nowrap flex gap-2 px-4 scrollbar-hide"
        >
          <TabsTrigger value="all">🗺️ All</TabsTrigger>
          <TabsTrigger value="rental">🏪 Rental Stations</TabsTrigger>
          <TabsTrigger value="battery">🔋 Battery Stations</TabsTrigger>
          <TabsTrigger value="maintenance">🔧 Maintenance</TabsTrigger>
        </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
