'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Image from 'next/image';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { formatCurrency } from '@/src/utils/formatCurrency';
import { Tabs, TabsList, TabsTrigger } from '@/src/components/ui/tabs';
import { EbikeModel, VEHICLE_TYPES, VehicleType } from '@/src/lib/ebikemodels/ebikeModelTypes';

export default function VehicleModelsPage() {
  const [models, setModels] = useState<EbikeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<string>('All');
  const router = useRouter();

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'ebikeModels'));
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            companyId: d.companyId || '',
            name: d.name || '',
            description: d.description || '',
            batteryCapacity: d.batteryCapacity || '',
            motorPower: d.motorPower,
            topSpeed: d.topSpeed,
            range: d.range,
            weight: d.weight,
            maxLoad: d.maxLoad,
            pricePerDay: d.pricePerDay || 0,
            pricePerHour: d.pricePerHour,
            pricePerWeek: d.pricePerWeek,
            pricePerMonth: d.pricePerMonth,
            imageUrl: d.imageUrl || '',
            available: d.available ?? true,
            type: (d.type || 'other').toLowerCase() as VehicleType,
            createdAt: d.createdAt,
            updatedAt: d.updatedAt,
          } as EbikeModel;
        });
        setModels(data);
      } catch (error) {
        console.error('Error fetching ebike models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  const filteredModels =
    activeType.toLowerCase() === 'all'
      ? models
      : models.filter((model) => model.type === activeType.toLowerCase());

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 text-gray-800">
          🛵 Choose Your Electric Ride
        </h1>

        {/* Tabs */}
        <div className="flex justify-center mb-6">
          <Tabs value={activeType} onValueChange={setActiveType}>
            <TabsList className="flex gap-2 overflow-x-auto whitespace-nowrap no-scrollbar bg-white rounded-full p-2 shadow min-w-full max-w-full">
              {VEHICLE_TYPES.map((type) => (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="text-sm sm:text-base px-4 py-1 rounded-full border border-gray-300 whitespace-nowrap data-[state=active]:bg-[#00d289] data-[state=active]:text-white"
                >
                  {type}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading...</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-5">
            {filteredModels.map((model) => (
              <div
                key={model.id}
                className="bg-white rounded-2xl shadow hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => router.push(`/vehicle-models/${model.id}`)}
              >
                <div className="bg-white h-[180px] w-full relative flex items-center justify-center p-4">
                  {model.imageUrl ? (
                    <Image
                      src={model.imageUrl}
                      alt={model.name}
                      width={300}
                      height={180}
                      className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="px-4 pb-4 pt-2">
                  <h3 className="font-semibold text-gray-800 text-base mb-1">{model.name}</h3>
                  <p className="text-sm text-[#00d289] font-semibold mb-2">
                    {formatCurrency(model.pricePerDay)} / day
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {model.motorPower && (
                      <div className="flex items-center gap-1">⚙️ {model.motorPower}W</div>
                    )}
                    {model.topSpeed && (
                      <div className="flex items-center gap-1">⚡ {model.topSpeed} km/h</div>
                    )}
                    {model.range && (
                      <div className="flex items-center gap-1">📏 {model.range} km</div>
                    )}
                    {model.maxLoad && (
                      <div className="flex items-center gap-1">🏋️ {model.maxLoad} kg</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
