'use client';

import { useMemo, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { X } from 'lucide-react';
import Header from '@/src/components/landingpage/Header';
import VehicleSwitcher from './VehicleSwitcher';
import { useTranslation } from 'react-i18next';

// ✅ Dynamic imports (SSR off) + fallback để tránh giật layout
const MapWrapper = dynamic(() => import('./MapWrapper'), { ssr: false, loading: () => <div className="h-full w-full" /> });
const TechnicianMarkers = dynamic(() => import('./TechnicianMarkers'), { ssr: false });
const RentalStationMarkers = dynamic(() => import('./RentalStationMarkers'), { ssr: false });
const BatteryStationMarkers = dynamic(() => import('./BatteryStationMarkers'), { ssr: false });
const BatteryChargingStationMarkers = dynamic(() => import('./BatteryChargingStationMarkers'), { ssr: false });

type TabKey = 'all' | 'rental' | 'battery' | 'battery_charging' | 'maintenance';
type VehicleType = 'car' | 'motorbike' | 'bike';

interface MyMapViewProps {
  onClose?: () => void;
}

const SPACER_H = 76;   // khoảng trống cho thanh tabs cố định
const Z_TABS   = 1200; // tabs (nổi trên map)
const Z_CLOSE  = 1100; // nút X (trên map)
const Z_SWITCH = 900;  // VehicleSwitcher (dưới toast/dialog)

export default function MyMapView({ onClose }: MyMapViewProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [vehicleType, setVehicleType] = useState<VehicleType>('motorbike');
  const { t } = useTranslation('common');

  const showAll = activeTab === 'all';

  const tabs = useMemo(
    () => [
      { key: 'all' as TabKey, label: t('my_map_view.tabs.all') },
      { key: 'rental' as TabKey, label: t('my_map_view.tabs.rental') },
      { key: 'battery' as TabKey, label: t('my_map_view.tabs.battery') },
      { key: 'battery_charging' as TabKey, label: t('my_map_view.tabs.battery_charging') },
      { key: 'maintenance' as TabKey, label: t('my_map_view.tabs.maintenance') },
    ],
    [t]
  );

  const handleTabChange = useCallback((v: string) => setActiveTab(v as TabKey), []);

  return (
    <div className="min-h-screen w-full relative flex flex-col">
      {/* khóa z-index cho Leaflet & UI ngay tại đây để chắc ăn */}
      <style jsx global>{`
        :root{
          --z-map:0;
          --z-leaflet-overlay:20;
        }
        .leaflet-container { z-index: var(--z-map) !important; }
        .leaflet-pane,.leaflet-pane * { z-index: var(--z-map) !important; }
        .leaflet-popup,.leaflet-top,.leaflet-bottom,.leaflet-marker-pane,.leaflet-tooltip-pane,.leaflet-control {
          z-index: var(--z-leaflet-overlay) !important;
        }
        /* Nếu VehicleSwitcher có class này, ép hạ z-index kể cả khi fixed */
        .bb-vehicle-switcher { z-index: ${Z_SWITCH} !important; }
      `}</style>

      {onClose && (
        <button
          onClick={onClose}
          aria-label={t('my_map_view.close_button')}
          className="absolute top-3 right-3 bg-white rounded-full shadow p-2 hover:bg-gray-100"
          style={{ zIndex: Z_CLOSE }}
          title={t('my_map_view.close_button')}
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>
      )}

      <Header />

      {/* Bọc switcher để kiểm soát z-index; 
         ➜ thêm className="bb-vehicle-switcher" trong VehicleSwitcher nếu nó dùng position: fixed */}
      <div className="relative" style={{ zIndex: Z_SWITCH }}>
        <VehicleSwitcher
          vehicleType={vehicleType}
          onChange={setVehicleType}
          // đảm bảo không đè modal/toast:
          zIndex={900}
          position="fixed"
          className="bb-vehicle-switcher"
        />
      </div>

      {/* Vùng map chiếm phần còn lại, luôn dưới thanh tabs */}
      <main className="relative flex-1 z-0">
        <div className="absolute inset-0 z-0">
          <MapWrapper key={`${activeTab}-${vehicleType}`}>
            {(showAll || activeTab === 'rental') && (
              <RentalStationMarkers vehicleType={showAll ? undefined : vehicleType} />
            )}
            {(showAll || activeTab === 'battery') && (
              <BatteryStationMarkers vehicleType={showAll ? undefined : vehicleType} />
            )}
            {(showAll || activeTab === 'battery_charging') && (
              <BatteryChargingStationMarkers vehicleType={showAll ? undefined : vehicleType} />
            )}
            {(showAll || activeTab === 'maintenance') && (
              <TechnicianMarkers vehicleType={showAll ? undefined : vehicleType} />
            )}
          </MapWrapper>
        </div>
        <div style={{ height: SPACER_H }} className="sm:h-[76px]" />
      </main>

      {/* Tabs cố định đáy (trên Map, dưới modal/toast) */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg py-2 pointer-events-auto pb-[calc(env(safe-area-inset-bottom,0px)+8px)]"
        style={{ zIndex: Z_TABS }}
        role="navigation"
        aria-label="Map filters"
      >
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="w-full overflow-x-auto">
            <TabsList className="flex gap-2 bg-white rounded-full px-4 py-2 min-w-max whitespace-nowrap mx-3">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.key}
                  value={tab.key}
                  className="rounded-full px-4 py-2 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
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
