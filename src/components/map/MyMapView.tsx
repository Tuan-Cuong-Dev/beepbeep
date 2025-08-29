'use client';

import { useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { X } from 'lucide-react';
import Header from '@/src/components/landingpage/Header';
import VehicleSwitcher from './VehicleSwitcher';
import { useTranslation } from 'react-i18next';

const MapWrapper                    = dynamic(() => import('./MapWrapper'), { ssr: false, loading: () => <div className="h-full w-full" /> });
const TechnicianMarkers             = dynamic(() => import('./TechnicianMarkers'), { ssr: false });
const RentalStationMarkers          = dynamic(() => import('./RentalStationMarkers'), { ssr: false });
const BatteryStationMarkers         = dynamic(() => import('./BatteryStationMarkers'), { ssr: false });
const BatteryChargingStationMarkers = dynamic(() => import('./BatteryChargingStationMarkers'), { ssr: false });

type TabKey = 'all' | 'rental' | 'battery' | 'battery_charging' | 'maintenance';
type VehicleType = 'car' | 'motorbike' | 'bike';

interface MyMapViewProps { onClose?: () => void; }

const SPACER_H = 48;
const Z_TABS   = 1200;
const Z_CLOSE  = 1100;

export default function MyMapView({ onClose }: MyMapViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorbike');
  const { t } = useTranslation('common');

  const showAll = activeTab === 'all';

  const tabs = useMemo(
    () => [
      { key: 'all' as TabKey,              label: t('my_map_view.tabs.all') },
      { key: 'rental' as TabKey,           label: t('my_map_view.tabs.rental') },
      { key: 'battery' as TabKey,          label: t('my_map_view.tabs.battery') },
      { key: 'battery_charging' as TabKey, label: t('my_map_view.tabs.battery_charging') },
      { key: 'maintenance' as TabKey,      label: t('my_map_view.tabs.maintenance') },
    ],
    [t]
  );

  const handleTabChange = useCallback((v: string) => setActiveTab(v as TabKey), []);

  return (
    <div className="min-h-screen w-full relative flex flex-col">
      <style jsx global>{`
        :root{ --z-map:0; --z-leaflet-overlay:20; }
        .leaflet-container { z-index: var(--z-map) !important; }
        .leaflet-pane,.leaflet-pane * { z-index: var(--z-map) !important; }
        .leaflet-popup,.leaflet-top,.leaflet-bottom,.leaflet-marker-pane,.leaflet-tooltip-pane,.leaflet-control { z-index: var(--z-leaflet-overlay) !important; }
      `}</style>

      {onClose && (
        <button
          onClick={onClose}
          aria-label={t('my_map_view.close_button')}
          className="absolute top-2 right-2 bg-white rounded-full shadow p-1.5 hover:bg-gray-100"
          style={{ zIndex: Z_CLOSE }}
          title={t('my_map_view.close_button')}
        >
          <X className="w-5 h-5 text-gray-800" />
        </button>
      )}

      <Header />

      <main className="relative flex-1 z-0">
        <div className="absolute inset-0 z-0">
          <VehicleSwitcher
            vehicleType={vehicleType}
            onChange={setVehicleType}
            position="absolute"
            top={72}
            right={8}
            zIndex={10}
          />

          <MapWrapper key={`${activeTab}-${vehicleType}`}>
            {(showAll || activeTab === 'rental') && (
              <RentalStationMarkers keyPrefix="rental" vehicleType={showAll ? undefined : vehicleType} />
            )}
            {(showAll || activeTab === 'battery') && (
              <BatteryStationMarkers keyPrefix="battery" vehicleType={showAll ? undefined : vehicleType} />
            )}
            {(showAll || activeTab === 'battery_charging') && (
              <BatteryChargingStationMarkers keyPrefix="charging" vehicleType={showAll ? undefined : vehicleType} />
            )}
            {(showAll || activeTab === 'maintenance') && (
              <TechnicianMarkers keyPrefix="tech" vehicleType={showAll ? undefined : vehicleType} />
            )}
          </MapWrapper>
        </div>
        <div style={{ height: SPACER_H }} className="sm:h-[48px]" />
      </main>

      {/* Tabs đáy: mini, 1 dòng, không xuống hàng trong className */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t shadow-sm py-1 px-2 pointer-events-auto pb-[calc(env(safe-area-inset-bottom,0px)+4px)]"
        style={{ zIndex: Z_TABS }}
        role="navigation"
        aria-label="Map filters"
      >
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="w-full overflow-x-auto">
            <TabsList className="flex gap-1 bg-transparent rounded-full px-2 py-1 min-w-max whitespace-nowrap mx-1">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-full px-2 py-1 text-xs data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
