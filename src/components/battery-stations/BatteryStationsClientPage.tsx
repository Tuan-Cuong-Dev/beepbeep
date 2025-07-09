'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';
import BatteryStationCard from './BatteryStationCard';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

const BatteryStationMap = dynamic(() => import('./BatteryStationMap'), { ssr: false });

// ✅ Hàm tính khoảng cách giữa hai tọa độ
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

export default function BatteryStationsClientPage() {
  const { location: userLocation } = useCurrentLocation();
  const [stations, setStations] = useState<BatteryStation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch active battery stations từ Firestore
  useEffect(() => {
    const fetchStations = async () => {
      try {
        const q = query(collection(db, 'batteryStations'), where('isActive', '==', true));
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          ...(doc.data() as BatteryStation),
          id: doc.id,
        }));
        setStations(data);
      } catch (err) {
        console.error('Error loading battery stations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  // ✅ Bộ lọc và sắp xếp theo khoảng cách
  const sortedStations = useMemo(() => {
    const filtered = stations.filter((station) => {
      const searchMatch =
        station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        station.displayAddress.toLowerCase().includes(searchTerm.toLowerCase());
      return searchMatch;
    });

    if (!userLocation || !Array.isArray(userLocation)) return filtered;

    const [userLat, userLng] = userLocation;

    return [...filtered].sort((a, b) => {
      const latA = a.coordinates?.lat ?? 0;
      const lngA = a.coordinates?.lng ?? 0;
      const latB = b.coordinates?.lat ?? 0;
      const lngB = b.coordinates?.lng ?? 0;

      const distA = getDistanceFromLatLng(userLat, userLng, latA, lngA);
      const distB = getDistanceFromLatLng(userLat, userLng, latB, lngB);

      return distA - distB;
    });
  }, [stations, searchTerm, userLocation]);

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <Header />

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-center items-center gap-2 mb-6">
          <img
            src="/assets/images/batterystation_new.png"
            alt="Battery Station Icon"
            className="w-8 h-8"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Battery Swap Stations Near You
          </h1>
        </div>

        <p className="text-center text-gray-600 mb-8">
          Find available battery swap stations near your location.
        </p>

        {/* 🔍 Bộ lọc tìm kiếm */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <Input
            placeholder="🔍 Search by name or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-1/3"
          />
        </div>

        {/* 🗺️ Bản đồ */}
        <BatteryStationMap stations={sortedStations} />

        {/* 📋 Danh sách trạm */}
        {loading ? (
          <p className="text-center text-gray-500 text-lg mt-10">⏳ Loading stations...</p>
        ) : sortedStations.length === 0 ? (
          <p className="text-center text-gray-500 text-lg mt-10">No stations found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8">
            {sortedStations.map((station) => (
              <BatteryStationCard
                key={station.id}
                station={station}
                userLocation={userLocation}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
