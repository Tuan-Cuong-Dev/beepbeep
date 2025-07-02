'use client';

import dynamic from 'next/dynamic';
import { useStations } from '@/src/hooks/useStations';
import { useUser } from '@/src/context/AuthContext';
import { useState, useMemo } from 'react';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';
import { SimpleSelect } from '@/src/components/ui/select';
import StationCard from '@/src/components/stations/StationCard';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation'; // 🆕 import

const StationMap = dynamic(() => import('@/src/components/stations/StationMap'), {
  ssr: false,
});

export default function StationPage() {
  const { user } = useUser();
  const { stations, loading } = useStations();
  const { location: userLocation } = useCurrentLocation(); // 🆕 lấy vị trí người dùng

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredStations = useMemo(() => {
    return stations.filter((station) => {
      const matchSearch =
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.displayAddress.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter ? station.status === statusFilter : true;

      return matchSearch && matchStatus;
    });
  }, [stations, searchTerm, statusFilter]);

  const statusOptions = [
    { label: 'All statuses', value: '' },
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-2">
          Station Directory
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Find all rental stations available in your network.
        </p>

        {/* Bộ lọc */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Input
            placeholder="🔍 Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3"
          />
          <SimpleSelect
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="⚙️ Filter by status"
            options={statusOptions}
            className="w-full md:w-1/4"
          />
        </div>

        <StationMap stations={filteredStations} />

        {loading ? (
          <p className="text-center text-gray-500 text-lg mt-10">⏳ Loading stations...</p>
        ) : filteredStations.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">
            No matching stations found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {filteredStations.map((station) => (
              <StationCard key={station.id} station={station} userLocation={userLocation} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
