'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/src/firebaseConfig';
import Header from '@/src/components/landingpage/Header';
import Footer from '@/src/components/landingpage/Footer';
import { Input } from '@/src/components/ui/input';
import { BatteryStation } from '@/src/lib/batteryStations/batteryStationTypes';
import { useCurrentLocation } from '@/src/hooks/useCurrentLocation';

const BatteryStationMap = dynamic(() => import('./BatteryStationMap'), { ssr: false });

// ✅ Tính khoảng cách
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
      }
    };

    fetchStations();
  }, []);

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
    <div className="bg-gray-100 min-h-screen font-sans overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <div className="relative h-[85vh] overflow-hidden rounded-lg">
          {/* Thanh tìm kiếm nổi trên bản đồ */}
          <div className="absolute px-12 top-4 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0 z-[1000] w-[95%] md:w-1/3">
            <Input
              placeholder="🔋 Search battery stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="shadow-lg"
            />
          </div>

          {/* Bản đồ */}
          <BatteryStationMap stations={sortedStations} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
