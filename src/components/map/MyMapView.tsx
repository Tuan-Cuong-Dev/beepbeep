'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { X } from 'lucide-react';
import Header from '@/src/components/landingpage/Header';
import VehicleSwitcher from './VehicleSwitcher';
import { useTranslation } from 'react-i18next';

// ✅ Giữ ssr: false như cũ
const MapWrapper = dynamic(() => import('./MapWrapper'), { ssr: false });
const TechnicianMarkers = dynamic(() => import('./TechnicianMarkers'), { ssr: false });
const RentalStationMarkers = dynamic(() => import('./RentalStationMarkers'), { ssr: false });
const BatteryStationMarkers = dynamic(() => import('./BatteryStationMarkers'), { ssr: false });
const BatteryChargingStationMarkers = dynamic(() => import('./BatteryChargingStationMarkers'), { ssr: false });

interface MyMapViewProps {
  onClose?: () => void;
}

export default function MyMapView({ onClose }: MyMapViewProps) {
  const [activeTab, setActiveTab] = useState<
    'all' | 'rental' | 'battery' | 'battery_charging' | 'maintenance'
  >('all');
  const [vehicleType, setVehicleType] = useState<'car' | 'motorbike' | 'bike'>('motorbike');
  const { t } = useTranslation('common');

  const showAll = activeTab === 'all';

  return (
    <div className="min-h-screen w-full relative flex flex-col">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-[1100] bg-white rounded-full shadow p-2 hover:bg-gray-100"
          title={t('my_map_view.close_button')}
        >
          <X className="w-6 h-6 text-gray-800" />
        </button>
      )}

      <Header />

      <VehicleSwitcher vehicleType={vehicleType} onChange={setVehicleType} />

      {/* 🔧 Vùng map chiếm phần còn lại, luôn dưới thanh tabs (z-0) */}
      <main className="relative flex-1 z-0">
        <div className="absolute inset-0 z-0">
          <MapWrapper key={activeTab + '-' + vehicleType}>
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

        {/* Spacer để nội dung không bị thanh fixed che khi scroll (nếu có) */}
        <div className="h-[76px] sm:h-[76px]" />
      </main>

      {/* 🔧 Thanh tabs cố định đáy, ưu tiên chạm trên mobile */}
      <div
        className="
          fixed bottom-0 left-0 right-0
          z-[1000] bg-white border-t shadow-lg
          py-2 pointer-events-auto
          pb-[calc(env(safe-area-inset-bottom,0px)+8px)]
        "
      >
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="w-full overflow-x-auto">
            <TabsList
              className="
                flex gap-2 bg-white rounded-full px-4 py-2 min-w-max whitespace-nowrap mx-3
              "
            >
              <TabsTrigger
                value="all"
                className="rounded-full px-4 py-2 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
              >
                {t('my_map_view.tabs.all')}
              </TabsTrigger>
              <TabsTrigger
                value="rental"
                className="rounded-full px-4 py-2 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
              >
                {t('my_map_view.tabs.rental')}
              </TabsTrigger>
              <TabsTrigger
                value="battery"
                className="rounded-full px-4 py-2 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
              >
                {t('my_map_view.tabs.battery')}
              </TabsTrigger>
              <TabsTrigger
                value="battery_charging"
                className="rounded-full px-4 py-2 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
              >
                {t('my_map_view.tabs.battery_charging')}
              </TabsTrigger>
              <TabsTrigger
                value="maintenance"
                className="rounded-full px-4 py-2 data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
              >
                {t('my_map_view.tabs.maintenance')}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
