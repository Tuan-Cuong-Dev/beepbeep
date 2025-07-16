// 📁 components/contribute/AddToMapPage.tsx
'use client';

import { useState } from 'react';
import AddRepairShopForm from './AddRepairShopForm';
import AddRentalShopForm from './AddRentalShopForm';
import AddBatteryStationForm from './AddBatteryStationForm';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { useTranslation } from 'react-i18next';

export default function AddToMapPage() {
  const [activeTab, setActiveTab] = useState<'repair' | 'rental' | 'battery'>('repair');
  const { t } = useTranslation('common');

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-3xl mx-auto w-full">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">
          {t('contribute.add_to_map')}
        </h1>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="w-full overflow-x-auto mb-4">
            <TabsList className="flex gap-2 bg-white rounded-lg px-2 py-2 min-w-max whitespace-nowrap justify-center sm:justify-center">
              <TabsTrigger value="repair" onClick={() => setActiveTab('repair')} className="text-sm sm:text-base">
                🔧 {t('contribute.repair')}
              </TabsTrigger>
              <TabsTrigger value="rental" onClick={() => setActiveTab('rental')} className="text-sm sm:text-base">
                🏪 {t('contribute.rental')}
              </TabsTrigger>
              <TabsTrigger value="battery" onClick={() => setActiveTab('battery')} className="text-sm sm:text-base">
                🔋 {t('contribute.battery')}
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        <div className="space-y-6">
          {activeTab === 'repair' && <AddRepairShopForm />}
          {activeTab === 'rental' && <AddRentalShopForm />}
          {activeTab === 'battery' && <AddBatteryStationForm />}
        </div>
      </main>
      <Footer />
    </div>
  );
}
