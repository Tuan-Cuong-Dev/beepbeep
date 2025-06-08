import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/src/components/ui/button';
import NotificationDialog from '@/src/components/ui/NotificationDialog';
import { useState } from 'react';

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

export default function EbikeModelList({ ebikemodels }: { ebikemodels: EbikeModel[] }) {
  const router = useRouter();
  const [showNotice, setShowNotice] = useState(false);

  return (
    <section className="font-sans py-10 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800 text-center">
          Choose Your Electric Ride
        </h2>

        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4 md:pb-6 w-max">
            {ebikemodels.map((model) => (
              <div
                key={model.id}
                className="bg-white text-gray-800 p-5 rounded-2xl shadow-md min-w-[260px] max-w-[260px] flex-shrink-0 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Image & Name link */}
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
                  <h3 className="text-lg font-semibold mt-3">{model.name}</h3>
                </div>

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

                {/* Rent Now button */}
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