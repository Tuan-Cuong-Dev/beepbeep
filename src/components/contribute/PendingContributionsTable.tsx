// 📁 components/admin/PendingContributionsTable.tsx
'use client';

import { useState } from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import PendingTechnicians from './PendingTechnicians';
import PendingRentalShops from './PendingRentalShops';
import PendingBatteryStations from './PendingBatteryStations';

export default function PendingContributionsTable() {
  const [tab, setTab] = useState('technicians');

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Pending Contributions</h2>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="bg-white border rounded mb-4">
          <TabsTrigger value="technicians">Technicians</TabsTrigger>
          <TabsTrigger value="rentalShops">Rental Shops</TabsTrigger>
          <TabsTrigger value="batteryStations">Battery Stations</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
