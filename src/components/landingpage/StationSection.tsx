'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStations } from '@/src/hooks/useStations';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation'; // ✅ Import hook
import StationCard from '@/src/components/stations/StationCard';
import { Button } from '@/src/components/ui/button';

export default function StationSection() {
  const { stations, loading } = useStations(); // Lấy toàn bộ station
  const { location: userLocation } = useCurrentLocation(); // ✅ Lấy vị trí người dùng
  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();

  return (
    <section className="font-sans pt-0 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center">
          Available Rental Stations
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading stations...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex gap-4 w-max pb-2">
                {stations.slice(0, 6).map((station) => (
                  <div
                    key={station.id}
                    className="min-w-[260px] max-w-[260px] flex-shrink-0"
                  >
                    <StationCard station={station} userLocation={userLocation} /> {/* ✅ Truyền vị trí */}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-center">
              <Button
                size="sm"
                variant="default"
                onClick={() => router.push('/stations')}
                className="text-white bg-[#00d289] hover:bg-[#00b47a] rounded-full px-6 py-2 text-sm shadow"
              >
                📍 View All Stations
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
