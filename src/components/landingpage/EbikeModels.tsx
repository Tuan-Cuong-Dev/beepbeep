'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';

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

export default function EbikeModelsSection() {
  const [models, setModels] = useState<EbikeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();

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
        setModels(data);
      } catch (error) {
        console.error('Error fetching ebike models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  return (
    <section className="font-sans pt-0 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          Explore Our Vehicles Models
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading vehicle models...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex gap-4 w-max pb-2">
                {models.slice(0, 6).map((model) => (
                  <div
                    key={model.id}
                    className="min-w-[260px] max-w-[260px] flex-shrink-0 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all"
                  >
                    <div
                      className="cursor-pointer"
                      onClick={() => router.push(`/vehicle-models/${model.id}`)}
                    >
                      {model.imageUrl ? (
                        <div className="bg-white rounded-t-2xl overflow-hidden">
                          <Image
                            src={model.imageUrl}
                            alt={model.name}
                            width={320}
                            height={200}
                            className="object-contain w-full h-[180px] transition-transform duration-300 hover:scale-105"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-[180px] bg-gray-200 flex items-center justify-center rounded-t-2xl">
                          <span className="text-gray-500">No Image</span>
                        </div>
                      )}

                    </div>

                    <div className="p-4">
                      <h3 className="text-base font-semibold text-gray-900">{model.name}</h3>
                      <p className="text-[#00d289] text-sm mt-1">
                        {model.pricePerDay.toLocaleString()} VND/day
                      </p>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs text-gray-600 mt-2">
                        {model.motorPower && <div>⚙️ {model.motorPower}W</div>}
                        {model.topSpeed && <div>⚡ {model.topSpeed} km/h</div>}
                        {model.range && <div>📏 {model.range} km</div>}
                        {model.maxLoad && <div>🏋️ {model.maxLoad} kg</div>}
                      </div>

                      <div className="mt-4">
                        <Button
                          size="sm"
                          variant="greenOutline"
                          className="w-full px-4 py-2 text-sm font-semibold text-[#00d289] border-[#00d289] hover:bg-[#00d289]/10 rounded-full flex items-center justify-center gap-2"
                          onClick={() => setShowNotice(true)}
                        >
                          🛵 Rent Now
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center">
              <Button
                size="sm"
                variant="default"
                onClick={() => router.push('/vehicle-models')}
                className="text-white bg-[#00d289] hover:bg-[#00b47a] rounded-full px-6 py-2 text-sm shadow"
              >
                🔍 View All Models
              </Button>
            </div>
          </>
        )}
      </div>

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
