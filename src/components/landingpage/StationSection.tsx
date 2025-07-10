'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useStations } from '@/src/hooks/useStations';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';
import StationCard from '@/src/components/rental-stations/StationCard';
import { Button } from '@/src/components/ui/button';

function getDistanceFromLatLng(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const parseCoords = (location: string): [number, number] => {
  const match = location.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
  if (!match) return [0, 0];
  return [parseFloat(match[1]), parseFloat(match[3])];
};

export default function StationSection() {
  const { stations, loading } = useStations();
  const { location: userLocation } = useCurrentLocation();
  const [showNotice, setShowNotice] = useState(false);
  const router = useRouter();

  const sortedStations = useMemo(() => {
    if (!userLocation || !Array.isArray(userLocation)) return stations;
    const [userLat, userLng] = userLocation;

    return [...stations].sort((a, b) => {
      const [latA, lngA] = parseCoords(a.location);
      const [latB, lngB] = parseCoords(b.location);
      const distA = getDistanceFromLatLng(userLat, userLng, latA, lngA);
      const distB = getDistanceFromLatLng(userLat, userLng, latB, lngB);
      return distA - distB;
    });
  }, [stations, userLocation]);

  return (
    <section className="font-sans pt-0 pb-6 px-4 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 text-center pt-6">
          {loading ? (
            '⏳ Loading stations...'
          ) : (
            <>
              <span className="sm:text-2xl md:text-3xl font-extrabold">
                {stations.length} stations
              </span>
              <br />
              <span className="sm:text-xl md:text-2xl text-gray-700">
                are ready to serve you!
              </span>
            </>
          )}
        </h2>

        {loading ? (
          <p className="text-center text-gray-500">⏳ Loading stations...</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <div className="flex gap-4 w-max pb-2">
                {sortedStations.slice(0, 6).map((station) => (
                  <div
                    key={station.id}
                    className="min-w-[260px] max-w-[260px] flex-shrink-0"
                  >
                    <StationCard
                      station={station}
                      userLocation={userLocation}
                    />
                  </div>
                ))}

                {/* ✅ Card cuối cùng: View All */}
                <div
                  onClick={() => router.push('/rental-stations')}
                  className="min-w-[260px] max-w-[260px] flex-shrink-0 cursor-pointer"
                >
                  <div className="border rounded-xl shadow bg-white h-full flex flex-col items-center justify-center p-6 text-center hover:shadow-md transition">
                    <h3 className="text-lg font-semibold text-gray-800">View All</h3>
                    <p className="text-sm text-gray-500 mt-1">See all rental stations</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
