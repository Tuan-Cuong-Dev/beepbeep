'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { X } from 'lucide-react';
import Header from '@/src/components/landingpage/Header';
import VehicleSwitcher from './VehicleSwitcher';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');

  const showAll = activeTab === 'all';

  const shouldShowBatteryStations =
    showAll || (activeTab === 'battery' && vehicleType !== 'bike');

  return (
    <div className="h-full w-full relative flex flex-col">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[1000] bg-white rounded-full shadow p-2 hover:bg-gray-100"
          title={t('my_map_view.close_button')}
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>
      )}

      <Header />

      <VehicleSwitcher vehicleType={vehicleType} onChange={setVehicleType} />

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

      <div className="bg-white border-t py-2">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="w-full overflow-x-auto">
            <TabsList className="flex gap-2 bg-white rounded-full px-4 py-2 min-w-max whitespace-nowrap">
              <TabsTrigger value="all">{t('my_map_view.tabs.all')}</TabsTrigger>
              <TabsTrigger value="rental">{t('my_map_view.tabs.rental')}</TabsTrigger>
              <TabsTrigger value="maintenance">{t('my_map_view.tabs.maintenance')}</TabsTrigger>
              <TabsTrigger value="battery">{t('my_map_view.tabs.battery')}</TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
