'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { db } from '@/src/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useRouter } from 'next/navigation';


interface EbikeModel {
  id: string;
  name: string;
  pricePerDay: number;
  imageUrl: string;
  motorPower?: number;
  topSpeed?: number;
  range?: number;
  maxLoad?: number;
}

function EbikeModelList({ ebikemodels }: { ebikemodels: EbikeModel[] }) {
  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();

  return (
    <section className="font-sans pt-6 pb-4 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4 md:pb-6 w-max">
            {ebikemodels.map((model) => (
              <div
                key={model.id}
                className="bg-white text-gray-800 p-5 rounded-2xl shadow-md min-w-[260px] max-w-[260px] flex-shrink-0 hover:shadow-xl transition-shadow duration-300"
              >
                <div
                  className="cursor-pointer"
                  onClick={() => router.push(`/vehicle-models/${model.id}`)}
                >
                  {model.imageUrl ? (
                    <Image
                      src={model.imageUrl}
                      alt={model.name}
                      width={240}
                      height={160}
                      className="rounded-xl object-cover w-full h-40"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gray-200 flex items-center justify-center rounded-xl">
                      <span className="text-gray-500">No Image</span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold mt-3">{model.name}</h3>
                <p className="text-[#00d289] text-base mt-1">
                  {model.pricePerDay.toLocaleString()} VND/day
                </p>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-gray-600 mt-3">
                  {model.motorPower !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-purple-500">⚙️</span>
                      <span className="font-medium">{model.motorPower} W</span>
                    </div>
                  )}
                  {model.topSpeed !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-orange-500">⚡</span>
                      <span className="font-medium">{model.topSpeed} km/h</span>
                    </div>
                  )}
                  {model.range !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-indigo-500">📏</span>
                      <span className="font-medium">{model.range} km</span>
                    </div>
                  )}
                  {model.maxLoad !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="text-amber-600">🏋️</span>
                      <span className="font-medium">{model.maxLoad} kg</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex justify-center">
                  <Button
                    size="sm"
                    variant="greenOutline"
                    onClick={() => setShowNotice(true)}
                    className="py-2 text-lg rounded-sm shadow-lg"
                  >
                    🛵 RENT NOW
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notification Dialog */}
      <NotificationDialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        type="info"
        title="🚧 Coming Soon"
        description="We are currently setting up our rental stations. The rent feature is not yet available."
      />
    </section>
  );
}

export default function EbikeModelsPage() {
  const [ebikemodels, setEbikemodels] = useState<EbikeModel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'ebikeModels'));
        const data = snapshot.docs.map((doc) => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || '',
            pricePerDay: d.pricePerDay || 0,
            imageUrl: d.imageUrl || '',
            motorPower: d.motorPower,
            topSpeed: d.topSpeed,
            range: d.range,
            maxLoad: d.maxLoad,
          };
        });
        setEbikemodels(data);
      } catch (error) {
        console.error('Error fetching ebike models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="text-center py-6">
        <h1 className="text-2xl font-bold text-gray-900">Electric Vehicle Rental List</h1>
        <p className="text-gray-600 mt-2">Find the best electric vehicle for your journey</p>
      </header>
      {loading ? (
        <p className="text-center text-gray-500 mt-10">⏳ Loading data...</p>
      ) : (
        <EbikeModelList ebikemodels={ebikemodels} />
      )}
    </div>
  );
}