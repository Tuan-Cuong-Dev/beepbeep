'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { X } from 'lucide-react';
import Header from '@/src/components/landingpage/Header';

const MapWrapper = dynamic(() => import('./MapWrapper'), { ssr: false });
const TechnicianMarkers = dynamic(() => import('./TechnicianMarkers'), { ssr: false });
const StationMarkers = dynamic(() => import('./StationMarkers'), { ssr: false });

interface MyMapViewProps {
  onClose?: () => void;
}

export default function MyMapView({ onClose }: MyMapViewProps) {
  const [activeTab, setActiveTab] = useState('all');

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

      <div className="text-center py-3 text-lg font-semibold">Explore Bíp Bíp</div>

      <div className="flex-1 relative">
        <MapWrapper>
          {(activeTab === 'all' || activeTab === 'station') && <StationMarkers />}
          {(activeTab === 'all' || activeTab === 'maintenance') && <TechnicianMarkers />}
        </MapWrapper>
      </div>

      <div className="bg-white border-t py-2">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full flex justify-around">
            <TabsTrigger value="all">🗺️ All</TabsTrigger>
            <TabsTrigger value="station">🏪 GoStation</TabsTrigger>
            <TabsTrigger value="maintenance">🔧 Maintenance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
