'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';

import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import AddRepairShopForm from './AddRepairShopForm';
import AddRentalShopForm from './AddRentalShopForm';
import AddBatteryStationForm from './AddBatteryStationForm';
import AddBatteryChargingStationForm from './AddBatteryChargingStationForm'; // ✅ NEW
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';

export default function AddToMapPage() {
  const [activeTab, setActiveTab] = useState<'repair' | 'rental' | 'battery' | 'charging'>('repair'); // ✅ Thêm charging
  const { t } = useTranslation('common');

  const renderActiveForm = () => {
    switch (activeTab) {
      case 'repair':
        return <AddRepairShopForm />;
      case 'rental':
        return <AddRentalShopForm />;
      case 'battery':
        return <AddBatteryStationForm />;
      case 'charging':
        return <AddBatteryChargingStationForm />; // ✅ NEW
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-6 max-w-3xl mx-auto w-full">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-center">
          {t('contribute.add_to_map')}
        </h1>

        {/* Coordinate Warning */}
        <div className="p-4 border rounded bg-yellow-50 text-sm text-center text-gray-700">
          <p>{t('contribute.coordinate_guide') || '⚠️ Missing translation'}</p>
          <p className="text-red-600 font-semibold">
            {t('contribute.coordinate_warning') || '⚠️ Warning missing'}
          </p>
          <Link
            href="https://www.google.com/maps"
            className="text-[#00d289] underline inline-block mt-2"
          >
            {t('contribute.check_location_on_maps') || 'How to get coordinates'}
          </Link>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <div className="w-full overflow-x-auto mb-4">
            <TabsList className="flex gap-2 bg-white rounded-lg px-2 py-2 min-w-max whitespace-nowrap justify-center">
              <TabsTrigger value="repair" className="text-sm sm:text-base">
                🔧 {t('contribute.repair')}
              </TabsTrigger>
              <TabsTrigger value="rental" className="text-sm sm:text-base">
                🏪 {t('contribute.rental')}
              </TabsTrigger>
              <TabsTrigger value="battery" className="text-sm sm:text-base">
                ♻️ {t('contribute.battery')}
              </TabsTrigger>
              <TabsTrigger value="charging" className="text-sm sm:text-base">
                🔌 {t('contribute.charging')} 
              </TabsTrigger>
            </TabsList>
          </div>
        </Tabs>

        {/* Form Section */}
        <div className="space-y-6">{renderActiveForm()}</div>
      </main>

      <Footer />
    </div>
  );
}
