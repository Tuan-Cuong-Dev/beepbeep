'use client';

import dynamic from 'next/dynamic';
import { useStations } from '@/src/hooks/useStations';
import { useUser } from '@/src/context/AuthContext';
import { useState, useMemo } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';
import StationCard from '@/src/components/rental-stations/StationCard';
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
  const { user } = useUser();
  const { stations, loading } = useStations();
  const { location: userLocation } = useCurrentLocation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const sortedStations = useMemo(() => {
    const filtered = stations.filter((station) => {
      const matchSearch =
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.displayAddress.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter ? station.status === statusFilter : true;
      return matchSearch && matchStatus;
    });

    if (!userLocation || !Array.isArray(userLocation)) return filtered;

    const [userLat, userLng] = userLocation;

    return [...filtered].sort((a, b) => {
      const [latA, lngA] = parseCoords(a.location);
      const [latB, lngB] = parseCoords(b.location);
      const distA = getDistanceFromLatLng(userLat, userLng, latA, lngA);
      const distB = getDistanceFromLatLng(userLat, userLng, latB, lngB);
      return distA - distB;
    });
  }, [stations, searchTerm, statusFilter, userLocation]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      {/* Bộ lọc nổi trên bản đồ */}
      <div className="relative h-[80vh] mb-12">
        <div className="absolute px-6 top-4 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-[1000] w-[90%] md:w-1/3">
          <Input
            placeholder="🔍 Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="shadow-lg"
          />
        </div>
        <StationMap stations={sortedStations} />
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {loading ? (
          <p className="text-center text-gray-500 text-lg mt-10">⏳ Loading stations...</p>
        ) : sortedStations.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No matching stations found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-4">
            {sortedStations.map((station) => (
              <StationCard key={station.id} station={station} userLocation={userLocation} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
