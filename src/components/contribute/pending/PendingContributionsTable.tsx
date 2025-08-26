'use client';

import { useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import PendingTechnicians from './PendingTechnicianPartner';
import PendingRentalShops from './PendingRentalShops';
import PendingBatteryStations from './PendingBatteryStations';
import PendingBatteryChargingStations from './PendingBatteryChargingStations'; // 👈 Thêm dòng này

export default function PendingContributionsTable() {
  const [tab, setTab] = useState('technicians');

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Pending Contributions</h2>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="w-full overflow-x-auto">
        <TabsList className="flex gap-2 bg-white border rounded mb-4 px-4 py-2 min-w-max whitespace-nowrap">
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="rentalShops">Rental Shops</TabsTrigger>
          <TabsTrigger value="batteryStations">Battery Stations</TabsTrigger>
          <TabsTrigger value="batteryChargingStations">Charging Stations</TabsTrigger>
        </TabsList>
      </div>

        <TabsPrimitive.Content value="technicians">
          <PendingTechnicians />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="rentalShops">
          <PendingRentalShops />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="batteryStations">
          <PendingBatteryStations />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="batteryChargingStations"> 
          <PendingBatteryChargingStations />
        </TabsPrimitive.Content>
      </Tabs>
    </div>
  );
}
