'use client';

import dynamic from 'next/dynamic';
import { useStations } from '@/src/hooks/useStations';
import { useState, useMemo } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

const StationMap = dynamic(() => import('@/src/components/rental-stations/StationMap'), {
  ssr: false,
});

function getDistanceFromLatLng(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function parseCoords(location: string): [number, number] {
  const match = location.match(/([-]?\d+(\.\d+)?)°\s*N?,?\s*([-]?\d+(\.\d+)?)°\s*E?/i);
  if (!match) return [0, 0];
  return [parseFloat(match[1]), parseFloat(match[3])];
}

export default function StationPage() {
  const { stations, loading } = useStations();
  const { location: userLocation } = useCurrentLocation();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const matchSearch =
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.displayAddress.toLowerCase().includes(searchTerm.toLowerCase());
      return matchSearch;
    });
  }, [stations, searchTerm]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header />

      {/* Bộ lọc nổi trên bản đồ */}
      <div className="relative h-[85vh]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-[1000] w-[90%] md:w-1/3">
          <Input
            placeholder="🔍 Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shadow-lg"
          />
        </div>

        {/* Bản đồ hiển thị toàn màn hình */}
        <StationMap stations={filteredStations} userLocation={userLocation} />
      </div>

      <Footer />
    </div>
  );
}
