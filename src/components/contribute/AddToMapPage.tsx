// 📁 components/contribute/AddToMapPage.tsx
'use client';

import { useState } from 'react';
import AddRepairShopForm from './AddRepairShopForm';
import AddRentalShopForm from './AddRentalShopForm';
import AddBatteryStationForm from './AddBatteryStationForm';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

export default function AddToMapPage() {
  const [tab, setTab] = useState<'repair' | 'rental' | 'battery'>('repair');

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center">Add to the Map</h1>

      <Tabs value={tab} onValueChange={(value) => setTab(value as any)} className="mb-4">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="repair">Repair Shop</TabsTrigger>
          <TabsTrigger value="rental">Rental Shop</TabsTrigger>
          <TabsTrigger value="battery">Battery Station</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'repair' && <AddRepairShopForm />}
      {tab === 'rental' && <AddRentalShopForm />}
      {tab === 'battery' && <AddBatteryStationForm />}
    </div>
  );
}
