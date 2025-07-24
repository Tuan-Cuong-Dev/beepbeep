'use client';

import { useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import PendingTechnicians from './PendingTechnicians';
import PendingRentalShops from './PendingRentalShops';
import PendingBatteryStations from './PendingBatteryStations';
import PendingBatteryChargingStations from './PendingBatteryChargingStations'; // 👈 Thêm dòng này

export default function PendingContributionsTable() {
  const [tab, setTab] = useState('technicians');

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Pending Contributions</h2>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-white border rounded mb-4 overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="rentalShops">Rental Shops</TabsTrigger>
          <TabsTrigger value="batteryStations">Battery Stations</TabsTrigger>
          <TabsTrigger value="batteryChargingStations">Charging Stations</TabsTrigger> {/* 👈 Thêm tab */}
        </TabsList>

        <TabsPrimitive.Content value="technicians">
          <PendingTechnicians />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="rentalShops">
          <PendingRentalShops />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="batteryStations">
          <PendingBatteryStations />
        </TabsPrimitive.Content>
        <TabsPrimitive.Content value="batteryChargingStations"> {/* 👈 Thêm nội dung */}
          <PendingBatteryChargingStations />
        </TabsPrimitive.Content>
      </Tabs>
    </div>
  );
}
