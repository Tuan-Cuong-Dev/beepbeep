'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import SkeletonCard from '@/src/components/skeletons/SkeletonCard';
import { useTranslation } from 'react-i18next';

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

export default function VehicleModelsSection() {
  const { t } = useTranslation();
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
        setModels(data.slice(0, 10)); // chỉ 10 model đầu
      } catch (error) {
        console.error('Error fetching vehicle models:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, []);

  return (
    <section className="font-sans pt-6 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        {!loading && (
          <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
            {t('vehicleModelSection.title')}
          </h2>
        )}

        <div className="overflow-x-auto">
          <div className="flex gap-4 w-max pb-2">
            {loading
              ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
              : models.slice(0, 6).map((model) => (
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
                          {t('vehicleModelSection.rent_button')}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

            {!loading && (
              <div
                onClick={() => router.push('/vehicle-models')}
                className="min-w-[260px] max-w-[260px] flex-shrink-0 cursor-pointer"
              >
                <div className="border rounded-2xl shadow bg-white h-full flex flex-col items-center justify-center p-6 text-center hover:shadow-md transition">
                  <h3 className="text-lg font-semibold text-gray-800">View All</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {t('vehicleModelSection.see_all_vehicles')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <NotificationDialog
        open={showNotice}
        onClose={() => setShowNotice(false)}
        type="info"
        title={t('vehicleModelSection.notification_title')}
        description={t('vehicleModelSection.notification_description')}
      />
    </section>
  );
}
