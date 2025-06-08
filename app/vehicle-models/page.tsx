'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Image from 'next/image';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { formatCurrency } from '@/src/utils/formatCurrency';

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

export default function VehicleModelsPage() {
  const [models, setModels] = useState<EbikeModel[]>([]);
  const [loading, setLoading] = useState(true);
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
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Choose Your Electric Ride
        </h1>

        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading...</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {models.map((model) => (
              <div
                key={model.id}
                className="bg-white rounded-xl shadow hover:shadow-md transition cursor-pointer overflow-hidden"
                onClick={() => router.push(`/vehicle-models/${model.id}`)}
              >
                <div className="relative w-full h-56 ">
                  {model.imageUrl ? (
                    <Image
                      src={model.imageUrl}
                      alt={model.name}
                      fill
                      className="object-contain p-4"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-gray-700 text-base">{model.name}</h3>
                  <p className="text-sm text-[#00d289] font-medium mb-2">
                    {formatCurrency(model.pricePerDay)} / day
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    {model.motorPower !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-purple-500">⚙️</span>
                        <span>{model.motorPower} W</span>
                      </div>
                    )}
                    {model.topSpeed !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-orange-500">⚡</span>
                        <span>{model.topSpeed} km/h</span>
                      </div>
                    )}
                    {model.range !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-blue-500">📏</span>
                        <span>{model.range} km</span>
                      </div>
                    )}
                    {model.maxLoad !== undefined && (
                      <div className="flex items-center gap-1">
                        <span className="text-amber-600">🏋️</span>
                        <span>{model.maxLoad} kg</span>
                      </div>
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
